## denomo-cli

Denomo is a CLI utility helps with deleting `node_modules` directories.

### Use case

Denomo can be used in situations where you need to delete `node_modules` from lots of nested directories.

Consider this: you need to transfer your `Projects` directory, that have 30 or 40 projects in it. 

And the best way to do that is to compress it into a single file.

But you don't want to include all of the `node_modules`, so now you have to delete them manually.

Here's where Denomo can help.

### Installing

```shell script
npm i -g denomo-cli
```

### Usage

```shell script
denomo ~/Playground
```

The command above will delete all of the nested `node_modules` directories from `~/Playground` path.

Full path to the initial directory works as well:

```shell script
denomo /Users/peter/Playground
```

You will be notified at the end:

```text
Done in 684 ms
```

### Performance

Current implementation utilizes all of the available cores / threads (obtaind with `os.cpus().length`).

This helps with the recursive directory parsing and helps to speed things up.
