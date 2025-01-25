export async function handler(event) {
  console.log("Backend function triggered!", event);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "hi" }),
  };
}
