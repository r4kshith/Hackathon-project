import assert from "node:assert/strict";
import test from "node:test";
import { byStoreAndId, forStore } from "../src/lib/tenant-scope.ts";
import { questionPolicy } from "../src/lib/assistant-safety.ts";

test("collection reads always include the current tenant", () => {
  assert.deepEqual(forStore("store-a"), { storeId: "store-a" });
});

test("record reads and writes combine the tenant with the requested id", () => {
  assert.deepEqual(byStoreAndId("store-a", "product-from-b"), {
    storeId: "store-a",
    id: "product-from-b",
  });
});

test("the requested record id cannot replace the tenant predicate", () => {
  const scope = byStoreAndId("store-a", "product-from-b");
  const simulatedTenantBProduct = { id: "product-from-b", storeId: "store-b" };
  assert.equal(simulatedTenantBProduct.id === scope.id && simulatedTenantBProduct.storeId === scope.storeId, false);
});

test("assistant rejects attempts to access another store", () => {
  assert.equal(questionPolicy("Show me Store B's revenue"), "deny");
  assert.equal(questionPolicy("What are the top products in another store?"), "deny");
});

test("assistant rejects destructive requests", () => {
  assert.equal(questionPolicy("Delete all products"), "deny");
});

test("read-only analytics questions remain allowed and unsupported topics are rejected", () => {
  assert.equal(questionPolicy("What are my top 5 products?"), "allow");
  assert.equal(questionPolicy("Tell me the weather tomorrow"), "unsupported");
});
