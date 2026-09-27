/** Web3Forms keys are public identifiers. Add the owner's key here when supplied. */
export const contactConfig = { accessKey: '' };

export function setupContact(form: HTMLFormElement) {
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const status = form.querySelector<HTMLElement>('[role="status"]')!;
  const label = submit.querySelector<HTMLElement>('[data-submit-label]')!;
  const nameInput = form.querySelector<HTMLInputElement>('[name="name"]')!;
  const messageInput = form.querySelector<HTMLTextAreaElement>('[name="message"]')!;
  const ready = Boolean(contactConfig.accessKey.trim());
  submit.disabled = !ready;
  label.textContent = ready ? 'Enviar mensaje' : 'Envío disponible pronto';
  status.textContent = ready ? '' : 'El formulario aún no está habilitado. Puedes escribirme directamente por correo.';
  let sending = false;
  for (const input of [nameInput, messageInput]) {
    input.addEventListener('input', () => input.setCustomValidity(''));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || sending) return;
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const minimumMessageLength = Math.max(1, messageInput.minLength);
    nameInput.setCustomValidity(name ? '' : 'Escribe tu nombre.');
    messageInput.setCustomValidity(message.length >= minimumMessageLength ? '' : `Escribe al menos ${minimumMessageLength} caracteres en tu mensaje.`);
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    if (fields.get('botcheck')) return;
    sending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    label.textContent = 'Enviando…';
    status.textContent = 'Tu mensaje se está enviando.';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          access_key: contactConfig.accessKey,
          from_name: 'Portafolio de Alexis Flores',
          subject: `Portafolio · ${fields.get('interest')}`,
          name,
          email: String(fields.get('email') || '').trim(),
          company: String(fields.get('company') || '').trim(),
          interest: fields.get('interest'),
          message,
          botcheck: false,
        }),
      });
      const result: { success?: boolean } = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Submission failed');
      status.textContent = 'Mensaje enviado. Gracias por contarme lo que tienes en mente.';
      form.reset();
    } catch {
      status.textContent = 'No se pudo enviar el mensaje. Tus datos siguen aquí; intenta de nuevo en un momento.';
    } finally {
      clearTimeout(timeout);
      sending = false;
      submit.disabled = false;
      label.textContent = 'Enviar mensaje';
      form.removeAttribute('aria-busy');
    }
  });
}
