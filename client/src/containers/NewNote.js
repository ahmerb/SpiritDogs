import React, { Component } from "react";
import { FormGroup, FormControl, ControlLabel, Image } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import config from "../config";
import "./NewNote.css";
import { API } from "aws-amplify";
import { s3Upload } from "../libs/awsLib";
import { PhotoPicker } from "aws-amplify-react";

export default class NewNote extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isClassifying: null,
      isUploading: null,
      file: null
    };
  }

  validateForm() {
    return true;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleFileChange = event => {
    this.setState({
      file: event.target.files[0]
    })
    // this.state.file = event.target.files[0];
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    if (this.state.file && this.state.file.size > config.MAX_ATTACHMENT_SIZE) {
      alert(`Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE/1000000} MB.`);
      return;
    }
  
    this.setState({ isUploading: true });
  
    try {
      const attachment = this.state.file
        ? await s3Upload(this.state.file)
        : null;
  
      const newNote = await this.createNote({
        attachment,
      });

      this.setState({
        isUploading: false,
        isClassifying: true
      });

      await this.classifyNote(newNote.noteId);
      
      this.props.history.push(`/notes/${newNote.noteId}`);
    } catch (e) {
      alert(e);
      this.setState({
        isUploading: false,
        isClassifying: false
      });
    }
  }
  
  createNote(note) {
    return API.post("notes", "/notes", {
      body: note
    });
  }

  classifyNote(noteId) {
    return API.get("notes", `/classify/${noteId}`);
  }

  render() {
    return (
      <div className="NewNote">
        <form onSubmit={this.handleSubmit}>
          <FormGroup controlId="file">
            <ControlLabel>
              Selfie - Image must be 4 channel (RGBA) Jpeg. E.g. <a href="https://raw.githubusercontent.com/ahmerb/SpiritDogs/master/classifier-sagemaker/images/dog_spotting1.jpg">this</a>
            </ControlLabel>
            <FormControl onChange={this.handleFileChange} type="file" />
          </FormGroup>
          <LoaderButton
            block
            bsStyle="primary"
            bsSize="large"
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isUploading}
            text="Create"
            loadingText="Creating…"
          />
          <LoaderButton
            block
            bsStyle="info"
            bsSize="large"
            disabled={true}
            type="submit"
            isLoading={this.state.isClassifying}
            text="Waiting for image..."
            loadingText="Classifying…"
          />
        </form>
      </div>
    );
  }
}