import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Masukkan email yang valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const orderItemSchema = z
  .object({
    name: z.string().trim().min(2, "Nama produk minimal 2 karakter."),
    description: z.string().trim().max(1000).optional(),
    material: z.string().trim().max(160).optional(),
    pricePerPiece: z.coerce
      .number()
      .int()
      .min(1, "Harga per pcs minimal Rp1."),
    sizes: z
      .array(
        z.object({
          size: z.string().trim().min(1).max(32),
          quantity: z.coerce.number().int().min(0),
        }),
      )
      .min(1),
  })
  .superRefine((item, context) => {
    const activeSizes = new Set<string>();

    item.sizes.forEach((size, index) => {
      if (size.quantity === 0) return;

      const normalizedSize = size.size.toLowerCase();
      if (activeSizes.has(normalizedSize)) {
        context.addIssue({
          code: "custom",
          message: "Ukuran dengan jumlah harus berbeda.",
          path: ["sizes", index, "size"],
        });
      }
      activeSizes.add(normalizedSize);
    });
  });

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(30),
  customerEmail: z.union([z.string().trim().email(), z.literal("")]).optional(),
  customerAddress: z.string().trim().max(2000).optional(),
  dueDate: z.string().optional(),
  notes: z.string().trim().max(5000).optional(),
  discount: z.coerce.number().int().min(0),
  initialPayment: z.coerce.number().int().min(0),
  paymentMethod: z.enum(["CASH", "TRANSFER", "QRIS"]).default("CASH"),
  items: z.array(orderItemSchema).min(1, "Tambahkan minimal satu item."),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().int().positive(),
  method: z.enum(["CASH", "TRANSFER", "QRIS"]),
  note: z.string().trim().max(255).optional(),
});

export const whatsappNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine(
    (value) => value.length >= 8 && value.length <= 15,
    "Masukkan nomor WhatsApp yang valid (8–15 digit).",
  );

const adminPasswordSchema = z
  .string()
  .min(12, "Kata sandi minimal 12 karakter.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Kata sandi terlalu panjang; maksimal 72 byte.",
  );

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  email: z.string().trim().email("Masukkan email yang valid.").max(191).toLowerCase(),
  password: adminPasswordSchema,
});

export const updateAdminSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  email: z.string().trim().email("Masukkan email yang valid.").max(191).toLowerCase(),
  password: z.union([z.literal(""), adminPasswordSchema]),
  isActive: z.boolean(),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;
