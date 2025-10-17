import Image from "next/image";
import React from "react";

const EmptyFavorites = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative h-[140px] w-[140px] sm:h-[180px] sm:w-[180px] md:h-[220px] md:w-[220px]">
        <Image src="/empty_favorites.svg" alt="Empty Favorites" fill className="object-contain" />
      </div>
      <div className="">
        <h2 className="text-2xl font-semibold text-gray-700 mt-6">
          No results found!
        </h2>
        <p className="text-muted-foreground text-sm mt-2 text-center">
          Try searching for something else
        </p>
      </div>
    </div>
  );
};

export default EmptyFavorites;
