import tensorflow as tf
from tensorflow import keras
from keras.models import load_model
from keras.preprocessing import image
import numpy as np

from keras.applications.inception_v3 import InceptionV3, preprocess_input

from keras import regularizers
from keras.layers import Conv2D, MaxPooling2D, GlobalAveragePooling2D, AveragePooling2D
from keras.layers import Input, Dropout, Flatten, Dense, Lambda
from keras.models import Model

dog_names = ['Affenpinscher', 'Afghan_hound', 'Airedale_terrier', 'Akita', 'Alaskan_malamute', 'American_eskimo_dog', 'American_foxhound', 'American_staffordshire_terrier', 'American_water_spaniel', 'Anatolian_shepherd_dog', 'Australian_cattle_dog', 'Australian_shepherd', 'Australian_terrier', 'Basenji', 'Basset_hound', 'Beagle', 'Bearded_collie', 'Beauceron', 'Bedlington_terrier', 'Belgian_malinois', 'Belgian_sheepdog', 'Belgian_tervuren', 'Bernese_mountain_dog', 'Bichon_frise', 'Black_and_tan_coonhound', 'Black_russian_terrier', 'Bloodhound', 'Bluetick_coonhound', 'Border_collie', 'Border_terrier', 'Borzoi', 'Boston_terrier', 'Bouvier_des_flandres', 'Boxer', 'Boykin_spaniel', 'Briard', 'Brittany', 'Brussels_griffon', 'Bull_terrier', 'Bulldog', 'Bullmastiff', 'Cairn_terrier', 'Canaan_dog', 'Cane_corso', 'Cardigan_welsh_corgi', 'Cavalier_king_charles_spaniel', 'Chesapeake_bay_retriever', 'Chihuahua', 'Chinese_crested', 'Chinese_shar-pei', 'Chow_chow', 'Clumber_spaniel', 'Cocker_spaniel', 'Collie', 'Curly-coated_retriever', 'Dachshund', 'Dalmatian', 'Dandie_dinmont_terrier', 'Doberman_pinscher', 'Dogue_de_bordeaux', 'English_cocker_spaniel', 'English_setter', 'English_springer_spaniel', 'English_toy_spaniel', 'Entlebucher_mountain_dog', 'Field_spaniel', 'Finnish_spitz', 'Flat-coated_retriever', 'French_bulldog', 'German_pinscher', 'German_shepherd_dog', 'German_shorthaired_pointer', 'German_wirehaired_pointer', 'Giant_schnauzer', 'Glen_of_imaal_terrier', 'Golden_retriever', 'Gordon_setter', 'Great_dane', 'Great_pyrenees', 'Greater_swiss_mountain_dog', 'Greyhound', 'Havanese', 'Ibizan_hound', 'Icelandic_sheepdog', 'Irish_red_and_white_setter', 'Irish_setter', 'Irish_terrier', 'Irish_water_spaniel', 'Irish_wolfhound', 'Italian_greyhound', 'Japanese_chin', 'Keeshond', 'Kerry_blue_terrier', 'Komondor', 'Kuvasz', 'Labrador_retriever', 'Lakeland_terrier', 'Leonberger', 'Lhasa_apso', 'Lowchen', 'Maltese', 'Manchester_terrier', 'Mastiff', 'Miniature_schnauzer', 'Neapolitan_mastiff', 'Newfoundland', 'Norfolk_terrier', 'Norwegian_buhund', 'Norwegian_elkhound', 'Norwegian_lundehund', 'Norwich_terrier', 'Nova_scotia_duck_tolling_retriever', 'Old_english_sheepdog', 'Otterhound', 'Papillon', 'Parson_russell_terrier', 'Pekingese', 'Pembroke_welsh_corgi', 'Petit_basset_griffon_vendeen', 'Pharaoh_hound', 'Plott', 'Pointer', 'Pomeranian', 'Poodle', 'Portuguese_water_dog', 'Saint_bernard', 'Silky_terrier', 'Smooth_fox_terrier', 'Tibetan_mastiff', 'Welsh_springer_spaniel', 'Wirehaired_pointing_griffon', 'Xoloitzcuintli', 'Yorkshire_terrier']
dog_breeds = len(dog_names)

img_width, img_height = 224, 224

def path_to_tensor(img_path):
  # loads RGB image as PIL.Image.Image type
  img = image.load_img(img_path, target_size=(img_width, img_height))
  # convert PIL.Image.Image type to 3D tensor with shape (224, 224, 3)
  x = image.img_to_array(img)
  # convert 3D tensor to 4D tensor with shape (1, 224, 224, 3) and return 4D tensor
  return np.expand_dims(x, axis=0)

def extract_InceptionV3():#tensor):
  return InceptionV3(weights='imagenet', include_top=False)#.predict(preprocess_input(tensor))

def predict_breed(path):
  # load image using path_to_tensor
  print('Loading image...')
  image_tensor = path_to_tensor(path)
  
  # obtain bottleneck features using extract_InceptionV3
  print('Extracting bottleneck features...')
  inception_model = InceptionV3(weights='imagenet', include_top=False)
  base_model = Model(inception_model.input, inception_model.output)

  # add different top layers 
  l0 = Input(shape=(5, 5, 2048))
  # l0 = base_model.output
  l1 = GlobalAveragePooling2D()(l0)
  l2 = Dense(150, activation='relu', kernel_regularizer=regularizers.l2(0.005))(l1)
  l3 = Dropout(0.4)(l2)
  l4 = Dense(dog_breeds, activation='softmax')(l3)
  top_model = Model(input=l0, output=l4)
  top_model.load_weights('saved_models/weights.best.InceptionV3.hdf5')
  
  full_model = Model(input=base_model.input, output=top_model(base_model.output))

  # save the model
  full_model.save('dog_breed_model.h5')
  
  # feed into top_model for breed prediction
  print('Feeding bottlenneck features into top model...')
  prediction = full_model.predict(preprocess_input(image_tensor))[0]
  
  breedNum = np.argmax(prediction)
  breed = dog_names[breedNum]
  confidence = prediction[breedNum]
  
  print('Predicting breed...')
  return breed, confidence

def make_prediction(path):
  breed, confidence = predict_breed(path)
  print('Predicted breed: {} with a confidence of {:.4f}'.format(breed.replace("_", " "), confidence))

if __name__ == "__main__":
  # test
  make_prediction('images/dog_spotting1.jpg')
