import { useRef } from 'react';
import { useVideoStore } from "../../stores/index";
import styles from './index.module.css'
export default function VideoResult() {

    const { videoUrl } = useVideoStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    if (!videoUrl) {
        return null;
    }
    return (
        <div className={styles.videoContainer} key={videoUrl}>
            <video ref={videoRef} controls className={styles.videoEl}>
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    )
}