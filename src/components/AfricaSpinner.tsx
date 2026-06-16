import { SVGProps } from "react";

export default function AfricaSpinner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M50,4 C62,4 70,12 74,22 C77,30 88,33 93,42 C97,49 91,55 84,58 C80,60 79,65 80,71 C81,78 73,80 68,86 C62,93 56,96 52,96 C48,96 47,89 44,80 C42,73 35,70 30,64 C24,57 21,49 19,40 C17,31 22,21 30,15 C36,10 43,4 50,4 Z" />
    </svg>
  );
}
