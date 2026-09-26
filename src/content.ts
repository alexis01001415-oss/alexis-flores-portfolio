/** Replace these provisional entries with verified personal content. */
export const profile = {
  name: 'Alexis Flores',
  email: '',
  github: 'https://github.com/alexis01001415-oss',
  specialization: 'Diseño digital y experiencias web',
};

export const projects: Record<string, { title: string; category: string; intro: string; challenge: string; approach: string[] }> = {
  forma: {
    title: 'Forma', category: 'Concepto exploratorio · Diseño web',
    intro: 'Una experiencia editorial para acercar el diseño de espacios a las personas.',
    challenge: 'Explorar cómo una marca puede transmitir calma y calidad sin saturar la pantalla de información.',
    approach: ['Jerarquía editorial que deja respirar al contenido.', 'Una paleta de materiales y una navegación sencilla.', 'Un recorrido adaptable a escritorio y móvil.'],
  },
  pulso: {
    title: 'Pulso', category: 'Concepto exploratorio · Producto digital',
    intro: 'Un ejercicio de interfaz para entender el dinero de un vistazo.',
    challenge: 'Convertir una vista de números en una experiencia fácil de leer, con metas claras y próximos pasos visibles.',
    approach: ['Balance y progreso con una jerarquía evidente.', 'Visualizaciones que acompañan a los datos.', 'Lenguaje cotidiano y contraste visual cuidado.'],
  },
  orbita: {
    title: 'Órbita', category: 'Concepto exploratorio · Identidad digital',
    intro: 'Una dirección visual para un estudio creativo con una personalidad propia.',
    challenge: 'Construir una identidad reconocible a través del ritmo, la tipografía y el contraste.',
    approach: ['Tipografía protagonista y mensajes breves.', 'Un sistema visual flexible y expresivo.', 'Interacciones que refuerzan la identidad.'],
  },
};
