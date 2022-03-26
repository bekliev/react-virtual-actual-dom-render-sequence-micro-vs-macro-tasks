export const micro = (...args) => {
  args = filterArgs(args);
  console.log(
    "%c" + args.rest.join(" / "),
    "background: blue; color: white; padding: 1px 5px",
    ...args.objects
  );
};

export const macro = (...args) => {
  args = filterArgs(args);
  console.log(
    "%c" + args.rest.join(" / "),
    "background: darkred; color: white; padding: 1px 5px",
    ...args.objects
  );
};

export const fetchSomething = () => {
  return new Promise((resolve) => setTimeout(resolve, 100));
};

function filterArgs(args) {
  return args.reduce(
    (acc, arg) => {
      const object = arg instanceof Object;
      if (object) {
        acc.objects.push(arg);
      } else {
        acc.rest.push(arg);
      }
      return acc;
    },
    {
      objects: [],
      rest: []
    }
  );
}
