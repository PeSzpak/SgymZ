import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu email").email("Esse email não parece válido"),
  password: z.string().min(6, "A senha tem no mínimo 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Escreva pelo menos 2 letras"),
    email: z.string().trim().min(1, "Informe seu email").email("Esse email não parece válido"),
    password: z.string().min(6, "Use no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não são iguais",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
