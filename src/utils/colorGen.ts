export const randomColor = (): string => {
  const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#F3FF33"];
  return colors[Math.floor(Math.random() * colors.length)];
};
