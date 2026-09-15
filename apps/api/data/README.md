# Expanded exercise catalog

`free-exercise-catalog.json` is generated from
[yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), which is
released into the public domain under the Unlicense. Run:

```sh
node apps/api/scripts/import-free-exercise-db.mjs /path/to/free-exercise-db
```

The API keeps the image files outside the app bundle and serves them from the
directory configured by `FREE_EXERCISE_DB_IMAGES`.
