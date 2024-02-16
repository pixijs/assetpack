import type { PluginOptions } from '@assetpack/core';
import type { AstcOptions, BcOptions, EtcOptions } from 'gpu-tex-enc';
import type { Type } from '@gpu-tex-enc/bc';
import type { Format } from '@gpu-tex-enc/etc';

export type AstcTexOptions = AstcOptions & {
    formatName: string;
};

export interface CompressAstcOptions extends PluginOptions<'nc'>
{
    compression: Partial<AstcTexOptions>;
}

export type BcTexOptions = BcOptions & {
    type: Type;
    formatName: string;
    adjustSize: boolean
};

export interface CompressBcOptions extends PluginOptions<'nc'>
{
    compression: Partial<BcTexOptions>;
}

export type EtcTexOptions = EtcOptions & {
    format: Format;
    formatName: string;
};

export interface CompressEtcOptions extends PluginOptions<'nc'>
{
    compression: Partial<EtcTexOptions>;
}

export interface CompressedTexOptions extends PluginOptions<'nc'>
{
    ASTC: Partial<AstcTexOptions> | false,

    BC1: Partial<Omit<BcTexOptions, 'type'>> | false,
    BC3: Partial<Omit<BcTexOptions, 'type'>> | false,
    BC4: Partial<Omit<BcTexOptions, 'type'>> | false,
    BC5: Partial<Omit<BcTexOptions, 'type'>> | false,
    BC7: Partial<Omit<BcTexOptions, 'type'>> | false,

    ETC1: Partial<Omit<EtcTexOptions, 'format'>> | false,
    RGB8: Partial<Omit<EtcTexOptions, 'format'>> | false,
    SRGB8: Partial<Omit<EtcTexOptions, 'format'>> | false,
    RGBA8: Partial<Omit<EtcTexOptions, 'format'>> | false,
    SRGBA8: Partial<Omit<EtcTexOptions, 'format'>> | false,
    RGB8A1: Partial<Omit<EtcTexOptions, 'format'>> | false,
    SRGB8A1: Partial<Omit<EtcTexOptions, 'format'>> | false,
    R11: Partial<Omit<EtcTexOptions, 'format'>> | false,
    SIGNED_R11: Partial<Omit<EtcTexOptions, 'format'>> | false,
    RG11: Partial<Omit<EtcTexOptions, 'format'>> | false,
    SIGNED_RG11: Partial<Omit<EtcTexOptions, 'format'>> | false,
}

