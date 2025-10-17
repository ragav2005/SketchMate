import Image from "next/image";
import React from "react";

const EmptySearch = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative h-[140px] w-[140px] sm:h-[180px] sm:w-[180px] md:h-[220px] md:w-[220px]">
        <Image
          src="/empty_search.svg"
          alt="Empty Search"
          fill
          className="object-contain"
        />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 mt-4">
        No results found!
      </h2>
      <p className="text-muted-foreground text-sm mt-2">
        Try searching for something else
      </p>
    </div>
  );
};

export default EmptySearch;
