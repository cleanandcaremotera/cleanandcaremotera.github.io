import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// A single image needs none of this chrome — plain <img>, no JS.
function SingleOffer({ src }) {
  return <img src={src} alt="Current offer" className="mx-auto w-full max-w-4xl rounded-2xl shadow-lg" />;
}

export default function OfferCarousel({ images }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4500, stopOnInteraction: false }),
  ]);
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (images.length === 1) return <SingleOffer src={images[0]} />;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl shadow-lg" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={src} className="min-w-0 flex-[0_0_100%] bg-cream">
              <img src={src} alt={`Current offer ${i + 1}`} className="aspect-[16/9] w-full object-contain" />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous offer"
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-md hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next offer"
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-md hover:bg-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to offer ${i + 1}`}
            className={`h-2 rounded-pill transition-all ${
              i === selected ? "w-6 bg-lime-dark" : "w-2 bg-ink/20 hover:bg-ink/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
