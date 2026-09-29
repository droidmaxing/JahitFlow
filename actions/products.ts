"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { actionErrorMessage } from "@/lib/action-error-message";
import { prisma } from "@/lib/prisma";
import {
  productTemplateActiveSchema,
  productTemplateSchema,
} from "@/lib/schemas";

export type ProductTemplateActionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveProductTemplate(
  input: unknown,
): Promise<ProductTemplateActionResult> {
  await requireUser();
  const parsed = productTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data produk tidak valid.",
    };
  }

  const { id, defaultPrice, ...fields } = parsed.data;
  const data = {
    ...fields,
    description: fields.description || null,
    material: fields.material || null,
    defaultPrice:
      defaultPrice === null ? null : new Prisma.Decimal(defaultPrice),
  };

  try {
    if (id) {
      const existing = await prisma.productTemplate.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        return { success: false, error: "Template produk tidak ditemukan." };
      }
      await prisma.productTemplate.update({ where: { id }, data });
    } else {
      await prisma.productTemplate.create({ data });
    }
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "saveProductTemplate",
        "Template produk belum berhasil disimpan. Silakan coba lagi.",
      ),
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/orders/new");
  return { success: true };
}

export async function setProductTemplateActive(
  input: unknown,
): Promise<ProductTemplateActionResult> {
  await requireUser();
  const parsed = productTemplateActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Data status produk tidak valid." };
  }

  try {
    const result = await prisma.productTemplate.updateMany({
      where: { id: parsed.data.id },
      data: { isActive: parsed.data.isActive },
    });
    if (result.count === 0) {
      return { success: false, error: "Template produk tidak ditemukan." };
    }
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(
        error,
        "setProductTemplateActive",
        "Status template produk belum berhasil diubah. Silakan coba lagi.",
      ),
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/orders/new");
  return { success: true };
}
