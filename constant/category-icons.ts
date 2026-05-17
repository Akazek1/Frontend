const C = "145B10";

export const CATEGORY_ICON_MAP: Record<string, string> = {
  // Cleaning
  clean:    `https://img.icons8.com/ios/48/${C}/broom.png`,
  broom:    `https://img.icons8.com/ios/48/${C}/broom.png`,
  vacuum:   `https://img.icons8.com/ios/48/${C}/vacuum-cleaner.png`,
  kitchen:  `https://img.icons8.com/ios/48/${C}/kitchen-room.png`,
  window:   `https://img.icons8.com/ios/48/${C}/window.png`,
  // Cooking
  cook:     `https://img.icons8.com/ios/48/${C}/chef-hat.png`,
  chef:     `https://img.icons8.com/ios/48/${C}/chef-hat.png`,
  food:     `https://img.icons8.com/ios/48/${C}/restaurant.png`,
  // Childcare
  nanny:    `https://img.icons8.com/ios/48/${C}/nanny.png`,
  babysit:  `https://img.icons8.com/ios/48/${C}/baby-feet.png`,
  child:    `https://img.icons8.com/ios/48/${C}/baby-feet.png`,
  // Electrical
  electr:   `https://img.icons8.com/ios/48/${C}/electricity.png`,
  // Plumbing
  plumb:    `https://img.icons8.com/ios/48/${C}/plumber.png`,
  pipe:     `https://img.icons8.com/ios/48/${C}/plumbing.png`,
  // Painting
  paint:    `https://img.icons8.com/ios/48/${C}/roller-brush.png`,
  // Carpentry / Repairs
  carpen:   `https://img.icons8.com/ios/48/${C}/carpenter.png`,
  repair:   `https://img.icons8.com/ios/48/${C}/screwdriver.png`,
  handyman: `https://img.icons8.com/ios/48/${C}/wrench.png`,
  // Gardening
  garden:   `https://img.icons8.com/ios/48/${C}/garden.png`,
  plant:    `https://img.icons8.com/ios/48/${C}/potted-plant.png`,
  grass:    `https://img.icons8.com/ios/48/${C}/grass.png`,
  // Laundry
  laundry:  `https://img.icons8.com/ios/48/${C}/washing-machine.png`,
  ironing:  `https://img.icons8.com/ios/48/${C}/iron.png`,
  iron:     `https://img.icons8.com/ios/48/${C}/iron.png`,
  // AC / Appliances
  ac:       `https://img.icons8.com/ios/48/${C}/air-conditioner.png`,
  air:      `https://img.icons8.com/ios/48/${C}/air-conditioner.png`,
  appli:    `https://img.icons8.com/ios/48/${C}/fan.png`,
  // Driving
  drive:    `https://img.icons8.com/ios/48/${C}/driver.png`,
  taxi:     `https://img.icons8.com/ios/48/${C}/taxi.png`,
  car:      `https://img.icons8.com/ios/48/${C}/car.png`,
  // Security
  guard:    `https://img.icons8.com/ios/48/${C}/security-guard.png`,
  secur:    `https://img.icons8.com/ios/48/${C}/shield.png`,
  // Pet
  pet:      `https://img.icons8.com/ios/48/${C}/dog.png`,
  dog:      `https://img.icons8.com/ios/48/${C}/dog.png`,
  // Tutoring
  tutor:    `https://img.icons8.com/ios/48/${C}/teacher.png`,
  teach:    `https://img.icons8.com/ios/48/${C}/school.png`,
  lesson:   `https://img.icons8.com/ios/48/${C}/book.png`,
  // Errands / Delivery
  errand:   `https://img.icons8.com/ios/48/${C}/shopping-basket.png`,
  deliv:    `https://img.icons8.com/ios/48/${C}/delivery.png`,
  shop:     `https://img.icons8.com/ios/48/${C}/shopping-cart.png`,
  // House general
  house:    `https://img.icons8.com/ios/48/${C}/cottage.png`,
  home:     `https://img.icons8.com/ios/48/${C}/cottage.png`,
};

export const DEFAULT_CATEGORY_ICON = `https://img.icons8.com/ios/48/${C}/wrench.png`;

export function getCategoryIcon(title: string): string {
  const lower = (title || "").toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return url;
  }
  return DEFAULT_CATEGORY_ICON;
}
