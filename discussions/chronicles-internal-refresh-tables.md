# Internal refresh tables

ClickHouse exposes temporary backing tables while refreshing a materialized view. Their names can begin with `.tmp.inner_id.` as well as `.inner`. Listing a scope currently excludes only `.inner`, so a concurrent refresh can make defining or describing views fail identifier validation.

View discovery should exclude all dot-prefixed internal tables. User-defined view names cannot begin with a dot, so this does not hide a supported user view or weaken identifier validation.

A feature scenario places a temporary backing-table name in the scope, then defines and describes a normal view. It reproduces the identifier failure before the filter is widened and passes afterward against ClickHouse. The existing materialized-view scenario continues to cover discovery of actual views.

This restores the documented view-discovery behavior; no public API or published documentation change is required.
