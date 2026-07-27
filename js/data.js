// Testimonios: se mantienen estáticos (no editables desde el panel de administración).
const TESTIMONIALS = [
  { name: 'Matías P.', text: '"El mejor fade que me han hecho en Santiago. Reservar por la web fue rapidísimo."', stars: 5, avatar: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=100&q=80&auto=format&fit=crop' },
  { name: 'Joaquín S.', text: '"Llegué sin hora esperando suerte y ahora siempre reservo online, cero espera."', stars: 5, avatar: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=100&q=80&auto=format&fit=crop' },
  { name: 'Benjamín T.', text: '"Le hice el combo corte + barba a mi hermano, quedó irreconocible. 10/10."', stars: 5, avatar: 'https://images.unsplash.com/photo-1629189784191-9afdcbcb0398?w=100&q=80&auto=format&fit=crop' },
  { name: 'Diego F.', text: '"El diseño freestyle quedó exactamente como lo pedí. Volveré cada mes."', stars: 5, avatar: 'https://images.unsplash.com/photo-1618049049816-43a00d5b0c3d?w=100&q=80&auto=format&fit=crop' },
];

// Todo lo demás (servicios, galería, horarios, datos bancarios, perfil del barbero) vive en
// Supabase y se administra desde admin.html. Estos valores son solo un FALLBACK que se
// muestra si Supabase todavía no está configurado en js/config.js o falla la conexión,
// para que el sitio nunca se vea completamente roto.

const FALLBACK_SERVICES = [
  { id: 'clasico', name: 'Corte Clásico', description: 'Corte tradicional con tijera y máquina, acabado prolijo.', price: 12000, duration: 30, icon: '✂️', photo_url: null },
  { id: 'fade', name: 'Fade / Degradado', description: 'Degradado preciso en piel o media piel, estilo urbano.', price: 15000, duration: 45, icon: '🌀', photo_url: null },
  { id: 'diseno', name: 'Diseño Freestyle', description: 'Líneas y diseños personalizados sobre fade.', price: 18000, duration: 60, icon: '⚡', photo_url: null },
  { id: 'barba', name: 'Barba + Perfilado', description: 'Perfilado de barba con navaja y toalla caliente.', price: 9000, duration: 30, icon: '🪒', photo_url: null },
  { id: 'combo', name: 'Combo Corte + Barba', description: 'El paquete completo: corte moderno + barba perfilada.', price: 20000, duration: 75, icon: '🔥', photo_url: null },
  { id: 'color', name: 'Color / Mechas', description: 'Coloración, mechas o platinado para un look único.', price: 25000, duration: 90, icon: '🎨', photo_url: null },
];

const FALLBACK_GALLERY = [
  { label: 'Skin Fade', photo_url: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=600&q=80&auto=format&fit=crop' },
  { label: 'Diseño Freestyle', photo_url: 'https://images.unsplash.com/photo-1568339434343-2a640a1a9946?w=600&q=80&auto=format&fit=crop' },
  { label: 'Corte + Barba', photo_url: 'https://images.unsplash.com/photo-1599011176306-4a96f1516d4d?w=600&q=80&auto=format&fit=crop' },
  { label: 'Degradado Bajo', photo_url: 'https://images.unsplash.com/photo-1599834562135-b6fc90e642ca?w=600&q=80&auto=format&fit=crop' },
  { label: 'Textura Natural', photo_url: 'https://images.unsplash.com/photo-1635273051937-a0ddef9573b6?w=600&q=80&auto=format&fit=crop' },
  { label: 'Línea Definida', photo_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80&auto=format&fit=crop' },
  { label: 'Fade Alto', photo_url: 'https://images.unsplash.com/photo-1657105052497-f996284ffff8?w=600&q=80&auto=format&fit=crop' },
  { label: 'Estilo Urbano', photo_url: 'https://images.unsplash.com/photo-1647140655214-e4a2d914971f?w=600&q=80&auto=format&fit=crop' },
];

const FALLBACK_SETTINGS = {
  start_hour: 10,
  end_hour: 19,
  closed_days: [0, 1], // 0=Domingo, 1=Lunes cerrado
  barber_name: 'Mashita',
  barber_bio: 'Especialista en fades de piel, diseños freestyle y estilos urbanos. Más de 8 años perfeccionando el oficio, formado en técnicas de barbering moderno y siempre al día con las tendencias que se ven en redes.',
  barber_tags: ['#SkinFade', '#DiseñoFreestyle', '#BarbaPerfilada', '#EstiloUrbano'],
  barber_photo_url: 'https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=900&q=80&auto=format&fit=crop',
  bank_info: {
    bank: 'Banco Estado',
    accountType: 'Cuenta Corriente',
    accountNumber: '123-4567-8900',
    holder: 'Mashita Barber SpA',
    rut: '77.111.222-3',
    email: 'pagos@mashitabarber.cl',
  },
};
