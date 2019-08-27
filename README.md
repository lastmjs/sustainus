# Sustainus

Sustainus is an npm package that allows software developers to setup one recurring donation that is automatically split evenly amongst their software dependencies.

## Use

There are two main ways to use Sustainus: sending donations as a developer and receiving donations as a project maintainer.

### Sending Donations

Install Sustainus from the terminal:

```bash
npm install -g sustainus
```

Run Sustainus from the terminal:

```bash
sustainus
```

On install, Sustainus scans the developer’s machine for node_modules directories, and finds the Ethereum address or name located in the ethereum property of the package.json file of each dependency.

Sustainus comes with a client app (most likely will be an Electron app) that allows the user to setup a local wallet and insert funds. The client will show all verified dependencies (dependencies with a well-formatted Ethereum address or name), and will allow the developer to set an amount and interval for payout.

Once setup and as long as the wallet maintains enough funds for payouts, Sustainus operates in the background indefinitely, continuously supporting the open source ecosystem automatically.

#### Determining Payout Percentage

For simplicity the heuristic for determining payout is to just split up the donation evenly among dependencies. After initial traction and proving of the idea, more complicated and fair heuristics could be experimented with.

### Receiving Donations

You do not need to install or run Sustainus to receive donations as a project maintainer. All that you have to do is add an Ethereum address or name (ENS) to the `ethereum` property of your project's `package.json` file. You can look at [Sustainus' `package.json` file as an example](https://github.com/lastmjs/sustainus/blob/master/package.json), or look at the examples below.

Here is an example of a `package.json` file using an Ethereum name:

```json
{
  "name": "sustainus",
  "ethereum": "sustainus.eth",
  "version": "0.0.38",
  "description": "Automatically donate to your dependencies to help sustain us"
}
```

Here is an example of a `package.json` file using an Ethereum address:

```json
{
  "name": "sustainus",
  "ethereum": "0xc9bc72fe58c5FAcc478514313FbA09d13ee3742b",
  "version": "0.0.38",
  "description": "Automatically donate to your dependencies to help sustain us"
}
```

Both an Ethereum address and name will work equally well, but Ethereum names are easier for users to deal with, and the addresses that they point to can be changed.

## Motivation

The open source ecosystem has always faced problems of sustainability. The Ethereum community is largely built on top of open source software and faces the same sustainability issues as the open source community at large.

One of the main advantages to this model is the reduction to zero of marginal cognitive friction for donating to each dependency. The software developer does not need to sign up individually for each dependency, considering pros and cons and amounts and payment systems. One donation is setup automatically, and Sustainus takes care of the rest.

The Ethereum blockchain and the open source ecosystem are already setup to mesh nicely. npm and its package.json system will make integrating Ethereum payments simple and permissionless.

I imagine/hope that Ethereum developers would be the first to enthusiastically adopt. Imagine if each Ethereum developer voluntarily chose to give just $5 per month back to the ecosystem.
