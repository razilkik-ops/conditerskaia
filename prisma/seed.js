import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";
import { env } from "../src/config/env.js";

const prisma = new PrismaClient();

function dateOnly(daysFromToday = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday));
}

const cakes = [
  {
    type: "CAKE",
    name: "Торт Облачная клубника",
    slug: "oblachnaya-klubnika",
    description: "Воздушный бисквит, клубничное кремю и сливочный мусс с ванилью.",
    price: 6800,
    imageUrl: "https://placehold.co/900x700/ff7ab8/331b44.png?text=3D+%D0%BA%D0%BB%D1%83%D0%B1%D0%BD%D0%B8%D1%87%D0%BD%D1%8B%D0%B9+%D1%82%D0%BE%D1%80%D1%82",
    category: "Фирменные торты",
    options: [
      { weight: "1.5 кг", filling: "Клубника-ваниль", decorStyle: "Пушистые кремовые облака", extraPrice: 0 },
      { weight: "2 кг", filling: "Клубника-ваниль", decorStyle: "Глянцевые ягоды и безе", extraPrice: 1800 },
      { weight: "2.5 кг", filling: "Клубника-шоколад", decorStyle: "3D-сердца и сахарные сферы", extraPrice: 2900 }
    ]
  },
  {
    type: "CAKE",
    name: "Торт Манго-диско",
    slug: "mango-disco",
    description: "Манговый мусс, маракуйя, хрустящий слой и яркий зеркальный декор.",
    price: 7400,
    imageUrl: "https://placehold.co/900x700/ffd166/3b2352.png?text=3D+%D0%BC%D0%B0%D0%BD%D0%B3%D0%BE+%D1%82%D0%BE%D1%80%D1%82",
    category: "Муссовые торты",
    options: [
      { weight: "1.5 кг", filling: "Манго-маракуйя", decorStyle: "Зеркальный глянец", extraPrice: 0 },
      { weight: "2 кг", filling: "Манго-кокос", decorStyle: "Сахарные планеты", extraPrice: 2100 },
      { weight: "3 кг", filling: "Манго-маракуйя", decorStyle: "Большой праздник", extraPrice: 4200 }
    ]
  },
  {
    type: "CAKE",
    name: "Торт Шоко-комета",
    slug: "shoko-kometa",
    description: "Шоколадный бисквит, ганаш, карамель и карамельный попкорн.",
    price: 7100,
    imageUrl: "https://placehold.co/900x700/8c5aee/fff0f8.png?text=3D+%D1%88%D0%BE%D0%BA%D0%BE+%D1%82%D0%BE%D1%80%D1%82",
    category: "Шоколадные торты",
    options: [
      { weight: "1.5 кг", filling: "Шоколад-карамель", decorStyle: "Карамельные всплески", extraPrice: 0 },
      { weight: "2 кг", filling: "Шоколад-вишня", decorStyle: "Космический велюр", extraPrice: 1900 },
      { weight: "2.5 кг", filling: "Тройной шоколад", decorStyle: "Кометы из безе", extraPrice: 3100 }
    ]
  }
];

const desserts = [
  {
    type: "DESSERT",
    name: "Пирожное Малиновый кубик",
    slug: "malinovy-kubik",
    description: "Малиновый мусс, фисташковый центр и бархатный велюр.",
    price: 720,
    imageUrl: "https://placehold.co/900x700/ff5c9a/ffffff.png?text=3D+%D0%BC%D0%B0%D0%BB%D0%B8%D0%BD%D0%BE%D0%B2%D1%8B%D0%B9+%D0%BA%D1%83%D0%B1%D0%B8%D0%BA",
    category: "Пирожные",
    quantities: [12, 8, 16, 0, 10]
  },
  {
    type: "DESSERT",
    name: "Макарон Солёная карамель",
    slug: "makaron-solenaya-karamel",
    description: "Миндальные крышечки, карамельный ганаш и щепотка соли.",
    price: 240,
    imageUrl: "https://placehold.co/900x700/f7a531/331b44.png?text=3D+%D0%BC%D0%B0%D0%BA%D0%B0%D1%80%D0%BE%D0%BD",
    category: "Макарон",
    quantities: [30, 18, 24, 12, 20]
  },
  {
    type: "DESSERT",
    name: "Эклер Фиалковый крем",
    slug: "ekler-fialkovy-krem",
    description: "Заварное тесто, фиалковый крем и сахарные кристаллы.",
    price: 390,
    imageUrl: "https://placehold.co/900x700/bb8cff/ffffff.png?text=3D+%D1%8D%D0%BA%D0%BB%D0%B5%D1%80",
    category: "Эклеры",
    quantities: [14, 10, 0, 8, 6]
  },
  {
    type: "DESSERT",
    name: "Тарталетка Лимонная молния",
    slug: "limonnaya-molniya",
    description: "Песочная основа, лимонный курд и обожжённая меренга.",
    price: 520,
    imageUrl: "https://placehold.co/900x700/fcff66/3b2352.png?text=3D+%D0%BB%D0%B8%D0%BC%D0%BE%D0%BD%D0%BD%D1%8B%D0%B9+%D1%82%D0%B0%D1%80%D1%82",
    category: "Тарталетки",
    quantities: [9, 7, 11, 4, 0]
  }
];

async function main() {
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.cakeOption.deleteMany();
  await prisma.unavailableDate.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "Администратор",
      email: env.adminEmail,
      passwordHash: await hashPassword(env.adminPassword),
      phone: "+375 29 000-00-00",
      isAdmin: true
    }
  });

  for (const cake of cakes) {
    const { options, ...data } = cake;
    await prisma.product.create({
      data: {
        ...data,
        cakeOptions: { create: options }
      }
    });
  }

  for (const dessert of desserts) {
    const { quantities, ...data } = dessert;
    const product = await prisma.product.create({ data });

    await prisma.inventory.createMany({
      data: quantities.map((quantityAvailable, index) => ({
        productId: product.id,
        date: dateOnly(index),
        quantityAvailable
      }))
    });
  }

  await prisma.unavailableDate.createMany({
    data: [
      { date: dateOnly(6), reason: "Большая свадебная сборка" },
      { date: dateOnly(10), reason: "Санитарный день кухни" }
    ]
  });

  console.log("Seed готов: витрина, остатки, админ и закрытые даты созданы.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
