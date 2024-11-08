import PRISMA from "../lib/pg";

 function generateAlphabetString(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}
 
const GenerateShortURL = async (): Promise<string> => {
  try {
 
    const NewURL = async (id: string): Promise<string> => {
      const exURL = await PRISMA.DB.link.findUnique({
        where: { shortUrl: id },
        select: { shortUrl: true },
      });

      // Return ID if unique, otherwise recursively generate a new one
      return !exURL ? id : await NewURL(generateAlphabetString(6));
    };

    const uniqueId = generateAlphabetString(6);
    return await NewURL(uniqueId);
  } catch (error) {
    console.error("Error generating short URL:", error);
    return "";  
  }
};

const LINK_UTILS = { GenerateShortURL };
export default LINK_UTILS;
