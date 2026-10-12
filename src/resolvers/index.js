'use strict';

const pkgResolvers = require('./packageJsonResolvers');
const gitResolvers = require('./gitResolvers');

/**
 * Registry mapping each supported placeholder name to a resolver function
 * of signature (ctx: { pkg, repoPath }) => string|null.
 */
const registry = {
  ProjectName: (ctx) => pkgResolvers.projectName(ctx.pkg),
  Description: (ctx) => pkgResolvers.description(ctx.pkg),
  MainEntryPoint: (ctx) => pkgResolvers.mainEntryPoint(ctx.pkg),
  Dependencies: (ctx) => pkgResolvers.dependencies(ctx.pkg),
  DevDependencies: (ctx) => pkgResolvers.devDependencies(ctx.pkg),
  TestCommand: (ctx) => pkgResolvers.testCommand(ctx.pkg),
  Author: (ctx) => pkgResolvers.author(ctx.pkg),
  License: (ctx) => pkgResolvers.license(ctx.pkg),
  LastCommitDate: (ctx) => gitResolvers.lastCommitDate(ctx.repoPath),
  LastCommitAuthor: (ctx) => gitResolvers.lastCommitAuthor(ctx.repoPath),
};

/**
 * Resolves a single placeholder name against the given context.
 * Unregistered names resolve to null (same as a failed lookup).
 * @param {string} name
 * @param {{ pkg: object|null, repoPath: string }} ctx
 * @returns {string|null}
 */
function resolve(name, ctx) {
  const resolver = registry[name];
  return resolver ? resolver(ctx) : null;
}

module.exports = { registry, resolve };
