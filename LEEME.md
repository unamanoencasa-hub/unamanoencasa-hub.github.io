# Publicar las reservas de Una mano en casa

La migración de solicitudes pendientes ya está aplicada en el proyecto **UMEC-gestor**. La agenda web sigue cerrada. El archivo `UMEC-V2/reservas-web.sql` documenta el cambio aplicado.

## 1. Autorizar el inicio de sesión

En [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/mkyzpdrcbrttifvveywl/auth/url-configuration), añade `https://unamanoencasa-hub.github.io/citas.html` a **Redirect URLs** y conserva las direcciones ya configuradas para el gestor. Para Google, el destino de retorno autorizado en Google Cloud es `https://mkyzpdrcbrttifvveywl.supabase.co/auth/v1/callback`. Se comprobó que Supabase ya redirige al proveedor Google. [Guía de Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

Habilita el proveedor Email y el alta de clientes. Comprueba que la plantilla **Magic Link** use el enlace de confirmación de Supabase y configura SMTP propio para enviar a clientes externos. El cliente debe abrir el enlace en el mismo navegador que usó para solicitarlo. [Acceso sin contraseña](https://supabase.com/docs/guides/auth/auth-email-passwordless) · [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp)

## 2. Publicar las dos interfaces

- **Gestor.** Revisa e incorpora el cambio de la rama `integracion-reservas-web` del repositorio [UMEC-gestion](https://github.com/jesusdeharotobar-gif/UMEC-gestion). La copia de `UMEC-V2/index.html` también está incluida.
- **Web oficial.** Con la cuenta `unamanoencasa-hub`, sube los tres archivos de `web-oficial` a la raíz de [su repositorio](https://github.com/unamanoencasa-hub/unamanoencasa-hub.github.io). Actualiza el `index.html` y conserva las imágenes y demás archivos que ya están allí. El archivo de inicio se preparó a partir del commit `04cec3a05118feb111426c79933d701dc8d41ed6`. Si entretanto cambiaste la portada, incorpora solo el botón que enlaza a `./citas.html`.

## 3. Probar y abrir la agenda

En UMEC V2, entra como administrador y pulsa **Reservas web**. Añade una franja de prueba de un trabajador y abre la agenda. En otro navegador o perfil, entra como cliente en la web, primero con Google y luego con el enlace de correo, y envía una solicitud. Debe figurar como **Pendiente de confirmación** en **Mis solicitudes**. Abre **Reservas web** en el gestor y confirma la solicitud. Comprueba que aparece en **Servicios** y que al actualizar **Mis solicitudes** pasa a **Confirmada**. Prueba también a rechazar otra solicitud.

El calendario ofrece la primera visita de los packs de 3, 6 y 12 horas. Los métodos de pago salen de **Ajustes → Métodos de pago** en UMEC V2. Los clientes pueden pedir el mismo hueco mientras siga libre. Al confirmar, el gestor vuelve a comprobar servicios y días bloqueados y asigna una persona disponible. Las fichas existentes se pueden vincular durante la confirmación tras verificar la identidad. El cliente consulta el estado en la web.
