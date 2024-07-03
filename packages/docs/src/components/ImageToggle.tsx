import { useState } from 'react';

type ToggleProps = {
    toggleImage: () => void;
    showImage1: boolean;
};

export const Toggle = ({ toggleImage, showImage1 }: ToggleProps) => (
    <div style={{ width: '100%' }}>
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                padding: '10px',
            }}
        >
            <p style={{ margin: '0 10px' }}>{showImage1 ? 'Original' : 'Processed'}</p>
            <div
                onClick={toggleImage}
                style={{
                    position: 'relative',
                    width: '60px', // Width of the toggle
                    height: '30px', // Height of the toggle
                    backgroundColor: 'hsl(225 6% 13%)', // Background color of the toggle
                    borderRadius: '15px', // Makes it pill-shaped
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                    border: '2px solid #696969', // Border color of the toggle
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '3px', // Small top margin to center vertically
                        left: showImage1 ? '5px' : '32px', // Moves the dot based on the toggle state
                        width: '20px', // Width of the dot
                        height: '20px', // Height of the dot
                        backgroundColor: showImage1 ? 'var(--ifm-color-secondary)' : 'var(--ifm-color-primary)', // Color of the dot
                        borderRadius: '50%', // Makes it circular
                        transition: 'left 0.3s', // Smooth transition for moving left and right
                    }}
                />
            </div>
        </div>
    </div>
);

export const Image = ({ image, primaryBoxShadow }: { image: string; primaryBoxShadow: boolean }) => (
    <div
        style={{
            width: '100%',
            height: '100%',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
        }}
    >
        <img
            src={image}
            alt="Input Image"
            style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: primaryBoxShadow ? '0 0 20px hsla(340, 70%, 44%, 0.5)' : '0 0 20px hsla(192, 84%, 40%, 0.5)'
            }}
        />
    </div>
);

export const ImageToggle = ({ image, height }: { image: string; height: number }) =>
{
    const [showImage1, setShowImage1] = useState(true);

    const toggleImage = () =>
    {
        setShowImage1(!showImage1);
    };

    height ??= 350;
    const image1 = `/assetpack/screenshots/${image}.png`;
    const image2 = `/assetpack/screenshots/${image}-pro.png`;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                paddingBottom: '24px',
            }}
        >
            <Toggle toggleImage={toggleImage} showImage1={showImage1} />
            <div style={{ position: 'relative', pointerEvents: 'none', width: '100%', height }}>
                <div
                    style={{
                        transition: 'opacity 0.5s ease-in-out',
                        opacity: showImage1 ? 1 : 0,
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <Image image={image1} primaryBoxShadow={false} />
                </div>
                <div
                    style={{
                        transition: 'opacity 0.5s ease-in-out',
                        opacity: showImage1 ? 0 : 1,
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <Image image={image2} primaryBoxShadow={true} />
                </div>
            </div>
        </div>
    );
};
