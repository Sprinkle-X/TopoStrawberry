# TopoStrawberry-RGBD Dataset

Official repository for the TopoStrawberry-RGBD dataset, including dataset documentation, access instructions, and website source code.

[Project website](https://sprinkle-x.github.io/TopoStrawberry/) | [Annotation protocol](https://sprinkle-x.github.io/TopoStrawberry/annotation-protocol.html) | [Website source](website/)

## Overview

TopoStrawberry-RGBD is a greenhouse strawberry dataset containing paired RGB images and depth maps. Each strawberry instance has a bounding box, five anatomical keypoints, and maturity and occlusion labels in COCO keypoint format with instance attributes. The data support harvest-oriented perception, including object detection, keypoint estimation, maturity recognition, and occlusion recognition.

## Dataset Access

The dataset is **controlled access** for approved non-commercial research and educational use. There is no public dataset download link.

1. Obtain the application form from the [dataset access section](https://sprinkle-x.github.io/TopoStrawberry/#resources).
2. Complete the applicant, research project, and declaration fields.
3. Submit the completed form to **Xiaohui.Zhu@xjtlu.edu.cn**, as specified in the form.
4. Applications are reviewed individually; submission does not guarantee access.

Access is granted to the applicant for the approved project. Do not share the dataset, access links, credentials, or keys. Commercial use requires a separate request to the data provider. See [DATASET_LICENSE.md](DATASET_LICENSE.md) for the access terms.

## Dataset Statistics

| Split | Paired RGB-D frames | Strawberry instances | Keypoints |
| --- | ---: | ---: | ---: |
| Train | 2,630 | 9,898 | 49,490 |
| Validation | 564 | 2,250 | 11,250 |
| Test | 564 | 2,138 | 10,690 |
| **Total** | **3,758** | **14,286** | **71,430** |

The images capture greenhouse scenes using four Intel RealSense D435i cameras at 1280 x 720 pixels. There is one object category, strawberry; maturity labels are unripe/ripe and occlusion labels are unoccluded/occluded. See the [website statistics](https://sprinkle-x.github.io/TopoStrawberry/#statistics) for detailed distributions.

## Annotation Protocol

Annotations use COCO keypoint JSON with bounding boxes and instance attributes. The five keypoints are ordered **Cut, Top, Bottom, Left, Right**. Depth maps are uint16 PNGs in millimeters; zero denotes invalid depth.

Refer to the [annotation protocol](https://sprinkle-x.github.io/TopoStrawberry/annotation-protocol.html) for landmark definitions, visibility conventions, and labeling rules, and the [data format section](https://sprinkle-x.github.io/TopoStrawberry/#protocol) for file organization.

## Benchmark

The dataset supports object detection, keypoint estimation, maturity recognition, and occlusion recognition. The [published website benchmark table](https://sprinkle-x.github.io/TopoStrawberry/#benchmark) compares keypoint estimation models using COCO keypoint AP, AP50, AP75, AR, and computational performance measures. Benchmark results and metric definitions are maintained on the website.

## Citation

## License

- **Dataset:** CC BY-NC 4.0 is stated on the project website and access application. Controlled access and the application terms are documented in [DATASET_LICENSE.md](DATASET_LICENSE.md).
- **Website source code:** [MIT license](LICENSE), including retained third-party notices. The code license does not grant access to the dataset.

Website development and deployment instructions are in [website/README.md](website/README.md).
