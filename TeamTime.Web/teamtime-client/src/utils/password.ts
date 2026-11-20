export function getPasswordRequirements(password: string) {
  return [
    {
      label: "12+ characters",
      met: password.length >= 12,
    },
    {
      label: "Upper & lowercase",
      met: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      label: "Number",
      met: /[0-9]/.test(password),
    },
    {
      label: "Symbol",
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];
}

function randomIndex(max: number): number {
  const buffer = new Uint32Array(1);
  const range = 0x1_0000_0000;
  const limit = range - (range % max);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

export function generateStrongPassword(): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "abcdefghijklmnopqrstuvwxyz" +
    "0123456789" +
    "!@#$%&*+-=?";

  let password: string;

  do {
    password = Array.from(
      { length: 16 },
      () => characters[randomIndex(characters.length)],
    ).join("");
  } while (
    !getPasswordRequirements(password).every((requirement) => requirement.met)
  );

  return password;
}
