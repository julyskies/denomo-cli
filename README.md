## denomo-cli

Denomo is a CLI utility that helps with deleting nested `node_modules` directories

### Use case

Denomo can be used in situations where you need to delete `node_modules` from lots of nested directories

Consider this: you need to transfer your `Projects` directory, that have 30 or 40 projects in it

And the best way to do that is to compress it into a single file

But you don't want to include all of the `node_modules`, so now you have to delete them manually

Denomo can help with that

### Install

**Node v14.14.0 or above is required for running this utility!** 

```shell script
npm i -g denomo-cli
```

### Usage

Run Denomo from the Terminal:

```shell script
denomo ~/path/to/projects
```

The command above will delete all of the nested `node_modules` directories from `~/path/to/projects` path

Full path to the initial directory works as well:

```shell script
denomo /Users/peter/path/to/projects
```

You will be notified at the end:

```text
Done in 684 ms
```

### Performance

Current implementation utilizes all of the available cores / threads (obtained with `os.cpus().length`)

This helps with the recursive directory parsing and allows Denomo to parse several directories at the same time

### Use with care

This module interacts with the filesystem and deletes files. Be careful when running it, make sure that you provide the correct initial path

The `/` path will not be processed (just in case)

### Linting

Using [ESLint](https://www.npmjs.com/package/eslint)

### License

[MIT](./LICENSE.md)
