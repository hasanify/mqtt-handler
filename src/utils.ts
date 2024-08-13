import random from "randomstring";

export const getPosition = (
  string: string,
  subString: string,
  index: number
) => {
  return string.split(subString, index).join(subString).length;
};

export const randomString = (len: number, lowercase?: boolean) => {
  const str = random.generate(len);
  return lowercase ? str.toLowerCase() : str;
};

export const capitalize = (s: string) => {
  return s
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
