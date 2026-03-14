import type {CellId, Compiled} from '../../../utilities/google-sheet-parser'
export type { CellId } from '../../../utilities/google-sheet-parser'

/**
 * Basic spreadsheet engine that stores raw input and computed values for each cell.
 *
 * This is the simplest version — no formula compilation, no dependency tracking,
 * no recomputation. `setRaw` stores the input as-is and treats it as the display value.
 *
 * Maps reserved for future use:
 * - #deps: tracks which cells a given cell depends on (upstream)
 * - #reverseDeps: tracks which cells depend on a given cell (downstream)
 * - #compiled: stores parsed/compiled formula representations
 */
export class TableEngine {
  /* Raw user input for each cell (e.g. "=A1+B1" or "42") */
  #raw: Map<CellId, string> = new Map();
  /* Computed display value for each cell (in this basic version, same as raw) */
  #val: Map<CellId, string> = new Map();
  /* Forward dependencies: cell → set of cells it depends on */
  #deps: Map<CellId, Set<CellId>> = new Map();
  /* Reverse dependencies: cell → set of cells that depend on it */
  #reverseDeps: Map<CellId, Set<CellId>> = new Map();
  /* Compiled formula AST for each cell */
  #compiled: Map<CellId, Compiled> = new Map();

  /**
   * Sets the raw input for a cell and updates its display value.
   * Returns the list of cells whose display value changed (just the cell itself).
   * In later versions, this will compile formulas, update deps, and recompute dependents.
   */
  setRaw(_id: CellId, _raw: string): { changed: CellId[] } {
    this.#raw.set(_id, _raw);
    this.#val.set(_id, _raw);
    return {changed: [_id]}
  }

  /** Returns the raw user input for a cell, or empty string if unset. */
  getRaw(_id: CellId): string {
    return this.#raw.get(_id) ?? '';
  }

  /** Returns the computed display value for a cell, or empty string if unset. */
  getValue(_id: CellId): string {
    return this.#val.get(_id) ?? '';
  }

  /**
   * Returns the set of cells that the given cell depends on (forward deps).
   * Lazily initializes an empty set if none exists.
   */
  getDeps(_id: CellId): ReadonlySet<CellId> {
    const deps = this.#deps.get(_id) ?? new Set();
    this.#deps.set(_id, deps);
    return deps;
  }

  /**
   * Returns the set of cells that depend on the given cell (reverse deps).
   * Lazily initializes an empty set if none exists.
   */
  getRevDeps(_id: CellId): ReadonlySet<CellId> {
    const deps = this.#reverseDeps.get(_id) ?? new Set();
    this.#reverseDeps.set(_id, deps);
    return deps;
  }
}
