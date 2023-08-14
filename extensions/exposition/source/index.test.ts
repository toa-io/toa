/**
 * WebStorm can't find jest types if they are in the root of the project,
 * while a current project has its own node_modules.
 *
 * Importing jest here fixes the issue.
 */
import 'jest'
