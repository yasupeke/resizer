interface IQualitySettings {
    [quality: number]: ISettings;
}

interface ISettings {
    defaultScale: number;
    defaultQuality?: number;
    scaleSettings?: IScaleSettings[];
}

interface IScaleSettings {
    path: string;
    scale: number;
    quality?: number;
}
