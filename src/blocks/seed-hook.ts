import { useMemo } from "react";
import { toBigintSafe } from "./core/utils/big-int";

const getSeedFromText = async (seedParam: string): Promise<bigint> => {
  const hashArray = Array.from(
    new Uint8Array(
      await window.crypto.subtle.digest(
        "sha-256",
        new TextEncoder().encode(seedParam),
      ),
    ),
  );
  return hashArray.slice(0, 8).reduce((acc, i) => (acc << 8n) + BigInt(i), 0n);
};

export type Seed = {
  seed: bigint;
  name: string;
};

export const useSeed = (): Promise<Seed> => {
  const seedParam = new URLSearchParams(window.location.search).get("seed");

  return useMemo(async () => {
    let name: string = "";
    if (seedParam === null) return { seed: BigInt(new Date().getTime()), name };

    if (seedParam === "")
      return { seed: await getSeedFromText(seedParam), name };

    const seed: bigint | null = toBigintSafe(seedParam);

    if (seed !== null) {
      return { seed, name };
    } else {
      name = seedParam;
      return { seed: await getSeedFromText(seedParam), name };
    }
  }, [seedParam]);
};
