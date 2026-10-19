import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransitionStatus,
  productionStatuses,
  statusDescriptions,
  statusLabels,
} from "../lib/order-status";

test("alur produksi hanya boleh maju ke tahap berikutnya (atau kembali untuk rework)", () => {
  assert.equal(canTransitionStatus("WAITING", "CUTTING"), true);
  assert.equal(canTransitionStatus("CUTTING", "SEWING"), true);
  assert.equal(canTransitionStatus("QC_PACKING", "SEWING"), true);
  assert.equal(canTransitionStatus("READY_FOR_PICKUP", "COMPLETED"), true);
});

test("lompat tahap dan status terminal ditolak", () => {
  assert.equal(canTransitionStatus("WAITING", "READY_FOR_PICKUP"), false);
  assert.equal(canTransitionStatus("CUTTING", "COMPLETED"), false);
  for (const terminal of ["COMPLETED", "CANCELLED"] as const) {
    for (const next of productionStatuses) {
      assert.equal(canTransitionStatus(terminal, next), false, `${terminal} -> ${next}`);
    }
  }
});

test("setiap status punya label dan deskripsi untuk UI", () => {
  for (const status of productionStatuses) {
    assert.ok(statusLabels[status]?.length, `label ${status}`);
    assert.ok(statusDescriptions[status]?.length, `deskripsi ${status}`);
  }
});