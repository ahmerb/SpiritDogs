# SpiritDogs Classifier

The SpiritDogs classifier.
Classifies dog breeds.
Inspired by github.com/jeremyjordan/dog-breed-classifier (and fairly modified).

The model is trained using transfer learning.
The final layers of InceptionV3 are replaced and retrained using a dog breed dataset.
Dataset available at https://s3-us-west-1.amazonaws.com/udacity-aind/dog-project/dogImages.zip

- `dog_breed_model.h5` is the saved Keras dog breed model.
- `dog_breed_model/` contains the exported model ready for use with TensorFlow Serving.
- `classify.py` contains the classifier.
- `Dockerfile` and `{nginx,uploadsize}.conf` are used to create Docker container for TensorFlow Serving.
- The shell scripts are used to deploy to AWS SageMaker and ECR. Are slightly modified from https://medium.com/ml-bytes/how-to-create-a-tensorflow-serving-container-for-aws-sagemaker-4853842c9751 by Marcio Dos Santos.
- Build Docker image with `docker build -t sagemaker-tf-serving`.
- Start Docker container with `docker run --rm -p 8080:8080 sagemaker-tf-serving`.
- `serving_sample_request.py` will send an image to the tf-serving docker container and return the result. The image must be the correct dimensions and format. `images/dog_spotting1.jpg` is a valid example.


