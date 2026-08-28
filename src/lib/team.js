export function buildByline(ownerName, teammateNames = []) {
  const names = [ownerName, ...teammateNames.filter(Boolean)].filter(Boolean);
  if (names.length <= 4) return `by ${names.join(", ")}`;
  return `by ${names.slice(0, 4).join(", ")}, ...`;
}

export function waLink(phone) {
  if (!phone) return null;
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  // assume a bare 10-digit number is an Indian mobile number missing its country code
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}
