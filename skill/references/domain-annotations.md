# Domain Purity — Audit Guide

Reference for the domain-purity portion of the audit. The underlying source is Erik Doernenburg's "Domain Annotations" pattern. **The audit does not need to cite the source in its output** — diagnose the smell in plain code-review voice.

The central concern: in DDD, the domain model should remain decoupled from infrastructure. Annotations are a way to attach domain metadata to model elements so that infrastructure (auditing, persistence, UI generation, permissions) can stay generic without coupling the model to any specific framework. This audit looks for places where that boundary has been violated or where ad-hoc patterns have been used in place of clean metadata.

## What "domain annotations" means (briefly)

A domain annotation has three defining properties:

1. Applied only to domain-model elements (domain classes, public methods, sometimes parameters) — not infrastructure classes, not private helpers, not technical methods like `equals` / `hashCode`.
2. Defined in the same package/namespace as the domain model.
3. Provides information usable by more than one infrastructure concern (auditing AND permissions AND loading, for example).

The contrast is **framework annotations** (`@Entity`, `@OneToMany`, `@Component`, `@Inject`, `@Table`, `@Column`, etc.) which couple the domain to a specific technology. Sometimes that coupling is a conscious trade-off; the audit's job is to make it visible.

---

## Pre-condition: identify the domain layer

These checks only make sense if the codebase has (or attempts) a domain layer. Look for:

- A directory or package named `domain/`, `model/`, `entities/`, `core/`, `business/`
- Classes that don't import infrastructure packages (`org.springframework.*`, `javax.persistence.*`, `django.db.*`, `sequelize`, `prisma`)
- Layered architecture conventions (hexagonal, onion, clean)

If no domain layer is identifiable, note it explicitly in the report ("No domain layer was identifiable; framework-coupling checks were applied opportunistically to types that look domain-shaped.") and either skip these checks or apply only the most generic ones.

---

## Audit checks

### Check 1 — Framework annotations on domain classes

Domain classes carrying framework annotations are coupled to that framework. Sometimes acceptable; often a missed abstraction.

**Catalogue, by language/stack:**

| Stack | Coupling annotations to flag on domain classes |
|---|---|
| Java / JPA | `@Entity`, `@Table`, `@Column`, `@OneToMany`, `@ManyToOne`, `@JoinColumn`, `@GeneratedValue`, `@Id` |
| Java / Spring | `@Component`, `@Service`, `@Repository`, `@Autowired`, `@Value`, `@Configuration`, `@Bean` |
| Java / Jackson | `@JsonProperty`, `@JsonIgnore`, `@JsonCreator` (low severity if model is also serialization output) |
| Java / Bean Validation | `@NotNull`, `@Size`, `@Email` (lower severity — these *are* arguably domain facts, but `javax.validation` is a framework dependency) |
| C# / EF | `[Table]`, `[Column]`, `[Key]`, `[ForeignKey]`, `[DatabaseGenerated]` |
| C# / ASP.NET | `[FromRoute]`, `[FromQuery]`, `[ApiController]`, `[Authorize]` (these belong on controllers, not domain) |
| Python / SQLAlchemy | `Column(...)`, `relationship(...)`, `declarative_base()` inheritance |
| Python / Django | `models.Model` inheritance, `models.CharField(...)` usage in entity definitions |
| Python / Pydantic | `BaseModel` for domain entities (lower severity — borderline of validation framework vs. data class library) |
| TypeScript / TypeORM | `@Entity()`, `@Column()`, `@PrimaryColumn()`, `@OneToMany()` |
| TypeScript / NestJS | `@Injectable()`, `@Inject()` on domain classes |

**Detection:** grep for the imports (`import javax.persistence.*`, `from sqlalchemy import`, `import { Entity } from 'typeorm'`) inside the domain layer, then locate annotated classes.

**Severity:**
- *Critical* — domain entities tightly bound to ORM internals (lazy-loading proxies leaking into business logic; can only exist as ORM-managed)
- *Major* — domain entities carry persistence annotations and the domain layer can't be unit-tested without the ORM
- *Minor* — light coupling (e.g., `@JsonProperty` on a few fields) where the trade-off is conscious and bounded

**Plain voice:** "`<DomainClass>` mixes domain semantics with `<framework>` mechanics. Consider separating the persistence model from the domain model: keep an infrastructure-free `<DomainClass>` and map it to a `<DomainClassEntity>` in the persistence layer (Repository pattern). If that's too heavy, at minimum extract a domain interface so business logic depends on the abstraction, not the ORM-managed class."

---

### Check 2 — God validate() methods

A long `validate()` method on a domain class is metadata pretending to be code. The metadata (max lengths, required fields, format rules) belongs adjacent to the field it constrains.

**Detection:** a `validate()`, `isValid()`, `check()`, or `assertValid()` method that runs through many fields with a chain of `if (x.length > 50) throw …` statements; multiple `validate*()` helper methods that do per-field checks via string-based reflection; hand-rolled rules that all follow the same shape.

**Severity:**
- *Major* — `validate()` methods >50 LOC with 5+ field checks following a uniform shape
- *Minor* — short `validate()` methods (<20 LOC), possibly fine, especially for cross-field rules

**Plain voice:** "`<class>.validate()` is N rules following the same shape (length, required, format). Move the rule data adjacent to each field — using language-native annotations (`@MaxLength(50)`, `[Required]`, etc.) defined in the domain package — and a single generic validator that walks them. The cross-field rules that genuinely need code stay in `validate()`; the per-field rules become declarative."

**Don't flag:** validation methods encoding genuinely cross-field logic ("shipping date must be after order date"); builder/factory `validate()` methods that check overall consistency.

---

### Check 3 — Marker interfaces or inheritance for classification

Using inheritance or marker interfaces to express classification (`class Country extends ReferenceData`, `interface Auditable {}`) burns the inheritance/interface slot and conflates classification with its storage.

**Detection:** empty marker interfaces (`interface Auditable`, `interface Reference`, `interface Sensitive`); inheritance hierarchies where the parent represents a category, not an is-a relationship (`class Order extends TransactionalEntity`); `instanceof` / `isinstance` / `is` checks used for classification dispatch.

**Severity:**
- *Major* — classification is the only purpose of the inheritance/interface AND multiple infrastructure concerns dispatch on it
- *Minor* — single-use marker interfaces that mostly stay out of the way

**Plain voice:** "`<classification>` is currently encoded by `<interface or parent class>`, but the relationship is *is-classified-as*, not *is-a*. A class-level annotation (`@<Classification>`) decouples the classification from inheritance, frees the slot for real domain modelling, and keeps the metadata in one place."

---

### Check 4 — Hardcoded navigation paths

Some properties of the model are *paths to a target type* (`Warehouse → Region → Country`). When multiple infrastructure concerns (permissions, scoped queries, audit) need this navigation, hardcoding the path everywhere works but doesn't scale.

**Detection:** methods that walk a fixed property path to extract a related object (`getCountry() { return region.country; }`); repeated permission/query logic that hard-codes the path from one entity type to a "scope" type (Country, Tenant, Organization).

**Severity:**
- *Major* — many such hardcoded paths AND many entity types needing the same scope navigation
- *Minor* — one or two such methods in a small model

**Plain voice:** "Navigation from `<source>` to `<target>` is hardcoded in `<location>`. If multiple concerns need this navigation, encode it as an annotation on the relevant property and walk it with a small generic path-finder — the path becomes data the model declares once, infrastructure walks generically."

---

### Check 5 — Implicit metadata being ignored

A lot of useful infrastructure decisions can be made from information already encoded in the model's *types*. Code that re-derives these facts wastes effort and creates maintenance debt.

**Detection:** manual mapping tables (`if field.name == "name" then String, else if ...`); hardcoded UI generation that doesn't introspect field types; repeated `Type.GetType()` / `field.getClass()` deriving facts the type system already encodes.

**Severity:** *Minor* — usually a refactoring opportunity rather than a defect.

**Plain voice:** "`<location>` re-derives field types or relationships that are already encoded in the model. A small reflective helper would eliminate the duplication and stay in sync as the model evolves."

---

### Check 6 — String-based reflection without typed wrappers

Reflection is fine when hidden behind a small typed helper API; sprinkling `getMethod("foo")` calls across business logic is fragile.

**Detection:** `getMethod("string")`, `getDeclaredField("string")`, `getattr(obj, "string")` calls scattered across business logic; configuration that maps field names by string (`{"customerName": 50}`) rather than by annotation.

**Severity:**
- *Major* — string-based reflection in core business logic with no typed wrapper
- *Minor* — string-based reflection in test helpers or one-off utilities

**Plain voice:** "`<location>` uses string-based reflection to look up `<member>`. Wrap the reflection in a small typed helper (or move the metadata to an annotation a helper reads) so the lookup becomes a single point of fragility rather than scattered."

---

### Check 7 — Annotations on non-domain elements

Domain annotations only apply to domain-model elements. Annotating a private helper or `equals`/`hashCode` is conceptually wrong.

**Detection:** domain-style annotations applied to private methods; annotations on `equals`, `hashCode`, `toString`, serialization hooks; annotations on infrastructure or controller classes that should be on domain classes.

**Severity:** *Minor* — usually a confusion of concepts rather than a real coupling problem.

---

## Severity calibration

- **Critical** — domain layer fundamentally coupled to a framework; can't run domain tests without the framework's runtime
- **Major** — clear coupling that hurts testability or migration, or god `validate()` methods
- **Minor** — design-hygiene observations, alternative-pattern suggestions

Like the OO checks, prefer lower severity when in doubt. Many real codebases consciously accept some coupling (e.g., using JPA entities directly when the alternative is too heavy) — note the trade-off rather than declaring it broken.

---

## What NOT to flag

- DTOs and serialization-only classes — they belong to the infrastructure, not the domain. Annotations on them are appropriate.
- ASP.NET / Spring controllers and services — infrastructure by definition; framework annotations are expected.
- Migration scripts and test fixtures.
- Pydantic models used purely for request/response schemas (vs. domain entities).
- A small amount of bean-validation usage when the project has explicitly chosen to live with that dependency.

---

## Reporting reminders

- **Lead with framework-coupling findings.** They have the highest leverage — fixing them unlocks testability, migration, and reuse.
- **Bundle related findings.** "All ten domain entities are JPA-managed" is one finding, not ten.
- **Acknowledge trade-offs.** "JPA coupling is consistent across the domain — this is a deliberate choice for many teams. If you'd want to test domain logic without the ORM, consider the Repository / persistence-model split."
- **Don't manufacture problems.** If the codebase has no domain layer (it's a CRUD app over a database), say so and skip these checks — don't synthesize a domain layer that isn't there just to find violations.
