export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black p-8" data-testid="landing-page">
      <h1 className="text-4xl font-bold text-center">CineHub Pro</h1>
      <p className="text-xl text-center mt-4">Welcome to your movie discovery platform!</p>
      <div className="text-center mt-8">
        <a href="/movies" className="bg-blue-500 text-white px-6 py-3 rounded-lg">Explore Movies</a>
      </div>
    </div>
  );
}
