// Datos estáticos de la barbería. Cambia estos valores para adaptar la app a otro negocio.

const SERVICES = [
  { id: 'clasico', name: 'Corte Clásico', desc: 'Corte tradicional con tijera y máquina, acabado prolijo.', price: 12000, duration: 30, icon: '✂️' },
  { id: 'fade', name: 'Fade / Degradado', desc: 'Degradado preciso en piel o media piel, estilo urbano.', price: 15000, duration: 45, icon: '🌀' },
  { id: 'diseno', name: 'Diseño Freestyle', desc: 'Líneas y diseños personalizados sobre fade.', price: 18000, duration: 60, icon: '⚡' },
  { id: 'barba', name: 'Barba + Perfilado', desc: 'Perfilado de barba con navaja y toalla caliente.', price: 9000, duration: 30, icon: '🪒' },
  { id: 'combo', name: 'Combo Corte + Barba', desc: 'El paquete completo: corte moderno + barba perfilada.', price: 20000, duration: 75, icon: '🔥' },
  { id: 'color', name: 'Color / Mechas', desc: 'Coloración, mechas o platinado para un look único.', price: 25000, duration: 90, icon: '🎨' },
];

const TESTIMONIALS = [
  { name: 'Matías P.', text: '"El mejor fade que me han hecho en Santiago. Reservar por la web fue rapidísimo."', stars: 5, avatar: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=100&q=80&auto=format&fit=crop' },
  { name: 'Joaquín S.', text: '"Llegué sin hora esperando suerte y ahora siempre reservo online, cero espera."', stars: 5, avatar: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=100&q=80&auto=format&fit=crop' },
  { name: 'Benjamín T.', text: '"Le hice el combo corte + barba a mi hermano, quedó irreconocible. 10/10."', stars: 5, avatar: 'https://images.unsplash.com/photo-1629189784191-9afdcbcb0398?w=100&q=80&auto=format&fit=crop' },
  { name: 'Diego F.', text: '"El diseño freestyle quedó exactamente como lo pedí. Volveré cada mes."', stars: 5, avatar: 'https://images.unsplash.com/photo-1618049049816-43a00d5b0c3d?w=100&q=80&auto=format&fit=crop' },
];

// Fotos reales de cortes y trabajo de barbería (banco de imágenes libres, uso comercial permitido)
const GALLERY = [
  { label: 'Skin Fade', img: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=600&q=80&auto=format&fit=crop' },
  { label: 'Diseño Freestyle', img: 'https://images.unsplash.com/photo-1568339434343-2a640a1a9946?w=600&q=80&auto=format&fit=crop' },
  { label: 'Corte + Barba', img: 'https://images.unsplash.com/photo-1599011176306-4a96f1516d4d?w=600&q=80&auto=format&fit=crop' },
  { label: 'Degradado Bajo', img: 'https://images.unsplash.com/photo-1599834562135-b6fc90e642ca?w=600&q=80&auto=format&fit=crop' },
  { label: 'Textura Natural', img: 'https://images.unsplash.com/photo-1635273051937-a0ddef9573b6?w=600&q=80&auto=format&fit=crop' },
  { label: 'Línea Definida', img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80&auto=format&fit=crop' },
  { label: 'Fade Alto', img: 'https://images.unsplash.com/photo-1657105052497-f996284ffff8?w=600&q=80&auto=format&fit=crop' },
  { label: 'Estilo Urbano', img: 'https://images.unsplash.com/photo-1647140655214-e4a2d914971f?w=600&q=80&auto=format&fit=crop' },
];

const BUSINESS_HOURS = { start: 10, end: 19, closedDays: [0, 1] }; // 0=Domingo, 1=Lunes cerrado

const BANK_INFO = {
  bank: 'Banco Estado',
  accountType: 'Cuenta Corriente',
  accountNumber: '123-4567-8900',
  holder: 'Mashita Barber SpA',
  rut: '77.111.222-3',
  email: 'pagos@mashitabarber.cl',
};
