const encodedSprite = encodeURIComponent(
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
);

export default function Bulb(id: string) {
  return (
    <div>
      <img src={`/sprite/${encodedSprite}`} alt="Pokemon sprite" />;
    </div>
  );
}
