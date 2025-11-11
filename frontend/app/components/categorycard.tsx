"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
}

export default function CategoryCard({ id, name, description, image }: Category) {
  const router = useRouter();

  const handleClick = () => {
    if (name === "1:64") {
      router.push("/category/size64");
    } else if (name === "1:43") {
      router.push("/category/size43");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 cursor-pointer overflow-hidden"
    >
      <img
        src={image}
        alt={name}
        className="w-full h-100 object-cover"
      />
      <div className="p-6">
        <h3 className="text-2xl font-bold text-red-600 mb-2 text">{name}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );
}
