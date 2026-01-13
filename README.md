# SLC CUTS - Barbería de Autor & Shop Online

Proyecto de e-commerce y panel de administración para **SLC CUTS**, barbería especializada en estilo, maestría y vanguardia.

LOGIN PARA EL PANEL ADMIN: slccuts1998@gmail.com / CUTSSLC;26
## 🚀 Tecnologías

- **Framework**: [Astro](https://astro.build/)
- **Frontend**: React (Components) + Vanilla CSS/Tailwind
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Pagos**: [Stripe API](https://stripe.com/)
- **Citas**: Integración con [Setmore](https://setmore.com/)

## 📂 Estructura del Proyecto

```text
/
├── database/           # Scripts SQL (Schema y Seed)
├── public/             # Assets estáticos (Logo, Favicon)
├── src/
│   ├── components/     # Componentes React y Astro
│   ├── layouts/        # Plantillas base
│   └── pages/          # Rutas del sitio (Públicas y Admin)
└── package.json        # Dependencias y scripts
```

## 🛠️ Configuración Local

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Crea un archivo `.env.local` con las siguientes claves:
    ```env
    PUBLIC_SUPABASE_URL=tu_url_supabase
    PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
    STRIPE_SECRET_KEY=tu_clave_secreta_stripe
    ```

3.  **Preparar Base de Datos**:
    Ejecuta el contenido de `database/schema.sql` y `database/seed.sql` en el SQL Editor de Supabase.

4.  **Iniciar Servidor de Desarrollo**:
    ```bash
    npm run dev
    ```

## 🔐 Seguridad y Rendimiento

- **Precios Blindados**: Validación de precios en el servidor vía Supabase para evitar manipulaciones en el checkout.
- **Acceso Administrativo**: Protección por rol (admin) a nivel de servidor (SSR).
- **Imágenes Optimizadas**: Uso de `astro:assets` para carga diferida y conversión automática a formatos modernos.
- **SEO**: Meta etiquetas dinámicas y OpenGraph para redes sociales.

---
© 2026 SLC CUTS. Todos los derechos reservados.
