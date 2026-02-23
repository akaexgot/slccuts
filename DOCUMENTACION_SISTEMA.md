# 📄 Documentación Técnica: SLC CUTS
## Barbería de Autor & Shop Online
**Versión:** 1.0  
**Fecha:** 23 de febrero de 2026  
**Estado:** Listo para Producción

---

## 📑 Tabla de Contenidos
1. [Introducción](#1-introducción)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Modelo de Datos (Base de Datos)](#4-modelo-de-datos)
5. [Seguridad y Autenticación](#5-seguridad-y-autenticación)
6. [Funcionalidades del E-commerce](#6-funcionalidades-del-e-commerce)
7. [Panel de Administración](#7-panel-de-administración)
8. [SEO e Integraciones Externas](#8-seo-e-integraciones-externas)
9. [Guía de Configuración y Despliegue](#9-guía-de-configuración-y-despliegue)
10. [Conclusión](#10-conclusión)

---

## 1. Introducción
**SLC CUTS** es una plataforma integral diseñada para una barbería moderna que combina la presencia digital corporativa con una tienda online (E-commerce). El sistema permite a los clientes adquirir productos de cuidado personal, mientras que proporciona a los administradores herramientas potentes para la gestión de inventario, ventas, noticias y contenido visual.

El objetivo principal es ofrecer una experiencia de usuario rápida, segura y estéticamente premium que refleje el estilo de la marca.

---

## 2. Arquitectura del Sistema
El proyecto sigue una arquitectura moderna de **Islas (Astro)** combinada con servicios en la nube (SaaS), lo que garantiza un rendimiento excepcional (Core Web Vitals) y una gran escalabilidad.

- **Frontend SSR (Server-Side Rendering)**: Astro gestiona el renderizado en el servidor para optimizar el SEO y la velocidad de carga inicial.
- **Micro-Frontends (Islas)**: React se utiliza para componentes interactivos complejos como el carrito de compras y el dashboard administrativo.
- **Backend as a Service (BaaS)**: Supabase actúa como motor de base de datos, sistema de autenticación y almacenamiento de archivos.
- **Edge Functions / API Routes**: Astro proporciona los endpoints necesarios para procesar pagos, gestionar stock y enviar correos electrónicos.

---

## 3. Tecnologías Utilizadas
### Núcleo
- **Astro**: Framework principal orientado a la velocidad.
- **React**: Biblioteca para componentes de interfaz dinámica.
- **Tailwind CSS**: Framework de estilos para un diseño moderno y responsive.

### Infraestructura y Servicios
- **Supabase (PostgreSQL)**: Base de datos relacional con Row Level Security (RLS).
- **Stripe API**: Gestión integral de pagos y pasarela de pago segura.
- **Resend**: Servicio de envío de correos electrónicos transaccionales.
- **Setmore**: Integración externa para la reserva de citas de barbería.

---

## 4. Modelo de Datos
La base de datos en Supabase está estructurada para garantizar la integridad referencial y la automatización mediante disparadores (triggers).

### Tablas Principales
- **`users`**: Almacena perfiles extendidos vinculados a la autenticación de Supabase (id, email, role).
- **`products` & `categories`**: Gestión del catálogo de la tienda.
- **`stock`**: Control de inventario en tiempo real.
- **`orders` & `order_items`**: Registro histórico de ventas y detalles de cada pedido.
- **`gallery_images`**: Imágenes para el porfolio de la barbería.
- **`news`**: Publicaciones del blog o sección de actualidad.
- **`page_visits`**: Registro de analítica interna.

### Automatización (SQL Triggers)
- **`handle_new_user()`**: Crea automáticamente un perfil en la tabla `public.users` al registrarse un nuevo usuario en la plataforma.
- **`handle_stock_deduction()`**: Al cambiar el estado de un pedido a 'pagado', el sistema descuenta automáticamente las unidades del inventario.
- **Temporizador de Carritos**: Las reservas de stock en el carrito expiran tras 10 minutos de inactividad para evitar el bloqueo de inventario.

---

## 5. Seguridad y Autenticación
### Autenticación
Se utiliza **Supabase Auth** para gestionar el registro e inicio de sesión. La seguridad se refuerza mediante el uso de cookies seguras que detectan automáticamente el entorno (HTTP vs HTTPS) para prevenir ataques de secuestro de sesión.

### Autorización (RLS)
Se han implementado políticas de **Row Level Security (RLS)** que aseguran que:
- Los clientes solo puedan acceder a sus propios datos de perfil y pedidos.
- El público general solo pueda leer productos activos, noticias publicadas y la galería.
- Solo los usuarios con el rol `'admin'` tengan permisos completos de escritura (`INSERT`, `UPDATE`, `DELETE`).

---

## 6. Funcionalidades del E-commerce
### Experiencia de Compra
- **Navegación Fluida**: Productos categorizados con filtros dinámicos.
- **Reserva de Stock**: Cuando un usuario añade un producto al carrito, se bloquea temporalmente para asegurar disponibilidad durante el proceso de pago.
- **Checkout Seguro**: Integración con Stripe Checkout para un procesamiento de pagos que cumple con la normativa PCI.

### Facturación Automatizada
Tras un pago exitoso:
1. El sistema genera una factura en formato PDF.
2. Se envía automáticamente al correo del cliente mediante **Resend**.
3. Se actualiza el estado del pedido y se ajusta el inventario.

---

## 7. Panel de Administración
El panel administrativo (`/admin`) es el centro de control del negocio:
- **Dashboard**: Visualización de estadísticas de ventas, productos más vendidos y visitas recientes.
- **Gestión de Catálogo**: Creación, edición y eliminación de productos y categorías.
- **Control de Pedidos**: Gestión del estado de las ventas (Pendiente, Pagado, Enviado, Cancelado).
- **Contenido Dinámico**: Gestión de la galería de fotos y las noticias del sitio.
- **Newsletter**: Herramienta para campañas de email marketing a usuarios suscritos.

---

## 8. SEO e Integraciones Externas
### Optimización para Buscadores (SEO)
- **Sitemap Dinámico**: Generación automática de `sitemap.xml`.
- **Schema.org (JSON-LD)**: Implementación de datos estructurados para que Google identifique el negocio local, los precios de los productos y la disponibilidad.
- **Performance**: Optimización de imágenes mediante Astro para carga ultra rápida.

### Integraciones
- **Setmore**: Widget integrado para la reserva directa de servicios de barbería sin salir del sitio.
- **Stripe**: Sincronización de estados de pago mediante Webhooks.

---

## 9. Guía de Configuración y Despliegue
### Variables de Entorno (.env)
Para el correcto funcionamiento, es necesario configurar las siguientes claves en el entorno de producción:
- `PUBLIC_SUPABASE_URL`: Endpoint de tu instancia de Supabase.
- `PUBLIC_SUPABASE_ANON_KEY`: Clave pública para acceso cliente.
- `STRIPE_SECRET_KEY`: Clave privada para procesar pagos.
- `RESEND_API_KEY`: Clave para el envío de correos.

### Pasos para el Paso a Producción
1. Verificar el dominio en el panel de **Resend**.
2. Cambiar las claves de Stripe de modo 'Test' a modo 'Live'.
3. Ejecutar las migraciones SQL en el editor de Supabase.
4. Desplegar en plataformas compatibles con Astro (Vercel, Netlify o servidor propio).

---

## 10. Conclusión
**SLC CUTS** no es solo un sitio web, sino una herramienta de negocio completa. La combinación de tecnologías punteras garantiza que el sitio sea rápido, seguro y fácil de escalar en el futuro, permitiendo a la marca centrarse en lo que mejor sabe hacer: ofrecer estilo y vanguardia a sus clientes.

---
*© 2026 SLC CUTS - Documentación Generada por Antigravity AI*
