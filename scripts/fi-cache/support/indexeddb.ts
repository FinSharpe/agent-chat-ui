/**
 * A spec IndexedDB for node (fake-indexeddb), installed before anything opens
 * a database, so idb-keyval and the query persister run as they do in a
 * browser — transaction ordering included.
 */
import "fake-indexeddb/auto";

export {};
