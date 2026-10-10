/** Query predicates always combine the authenticated store with any record identifier. */
export function forStore(storeId: string) {
  return { storeId };
}

export function byStoreAndId(storeId: string, id: string) {
  return { storeId, id };
}
