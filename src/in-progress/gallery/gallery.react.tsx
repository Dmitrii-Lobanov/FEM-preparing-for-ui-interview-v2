import css from './gallery.module.css';
import flex from '../../utilities/flex.module.css';
import { cx } from '../../utilities/utility';
import { useState, useEffect, useCallback, useRef } from 'react';

type TGalleryProps = {
    images: string[];
}

export const Gallery = ({ images }: TGalleryProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex((prevIndex) => Math.min(images.length - 1, prevIndex + 1));
    }, [images.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePrev, handleNext]);

    if (images.length === 0) {
        return (
            <section className={css.container}>
                <div className={css.empty}>No images to display</div>
            </section>
        );
    }

    return (
        <section className={css.container}>
            <button
                disabled={currentIndex === 0}
                className={cx(css.button, css.buttonPrev)}
                onClick={handlePrev}
                aria-label="Previous image"
            >
                {'<'}
            </button>

            <ul
                className={cx(flex.flexRowStart, css.list)}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((image, index) => {
                    return (
                        <li
                            key={index}
                            className={css.item}
                        >
                            <img
                                src={currentIndex + 2 >= index ? image : undefined}
                                alt={`Gallery image ${index + 1}`}
                            />
                        </li>
                    );
                })}
            </ul>

            <button
                disabled={currentIndex === images.length - 1}
                className={cx(css.button, css.buttonNext)}
                onClick={handleNext}
                aria-label="Next image"
            >
                {'>'}
            </button>

            <div className={css.indicators}>
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={cx(css.dot, currentIndex === index ? css.dotActive : '')}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to image ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

const MOCK_IMAGES: string[] = [
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2',
    'https://picsum.photos/800/600?random=3',
    'https://picsum.photos/800/600?random=4',
    'https://picsum.photos/800/600?random=5',
    'https://picsum.photos/800/600?random=6',
    'https://picsum.photos/800/600?random=7',
    'https://picsum.photos/800/600?random=8',
    'https://picsum.photos/800/600?random=9',
];

export const GalleryExample = () => {
    return <Gallery images={MOCK_IMAGES} />;
};
