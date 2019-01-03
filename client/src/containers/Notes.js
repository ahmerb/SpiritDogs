import React, { Component } from "react";
import { API, Storage } from "aws-amplify";
import { Image, Grid, Col, Row } from "react-bootstrap";
import config from "../config";
import "./Notes.css";
import { s3Upload } from "../libs/awsLib";


export default class Notes extends Component {
  constructor(props) {
    super(props);

    this.file = null;

    this.state = {
        isLoading: null,
        isDeleting: null,
        note: null,
        content: "",
        attachmentURL: null,
        dogURL: null,
    };
  }

  async componentDidMount() {
    try {
      let attachmentURL;
      let dogURL;
      const note = await this.getNote();
      const { content, attachment, dog, dogNumber } = note;

      if (attachment) {
        attachmentURL = await Storage.vault.get(attachment);
      }

      if (dog) {
        dogURL = await Storage.get(`${dogNumber}/1.jpg`, 
        {
          bucket: 'ahmerb-spiritdogs-dogs'
        });
      }

      this.setState({
        note,
        content,
        attachmentURL,
        dogURL
      });
    } catch (e) {
      alert(e);
    }
  }

  getNote() {
    return API.get("notes", `/notes/${this.props.match.params.id}`);
  }

  validateForm() {
    return this.state.content.length > 0;
  }
  
  formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }
  
  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }
  
  handleFileChange = event => {
    this.file = event.target.files[0];
  }
  saveNote(note) {
    return API.put("notes", `/notes/${this.props.match.params.id}`, {
      body: note
    });
  }
  
  handleSubmit = async event => {
    let attachment;
  
    event.preventDefault();
  
    if (this.file && this.file.size > config.MAX_ATTACHMENT_SIZE) {
      alert(`Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE/1000000} MB.`);
      return;
    }
  
    this.setState({ isLoading: true });
  
    try {
      if (this.file) {
        attachment = await s3Upload(this.file);
      }
  
      await this.saveNote({
        content: this.state.content,
        attachment: attachment || this.state.note.attachment
      });
      this.props.history.push("/");
    } catch (e) {
      alert(e);
      this.setState({ isLoading: false });
    }
  }
  
  
  deleteNote() {
    return API.del("notes", `/notes/${this.props.match.params.id}`);
  }
  
  handleDelete = async event => {
    event.preventDefault();
  
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );
  
    if (!confirmed) {
      return;
    }
  
    this.setState({ isDeleting: true });
  
    try {
      await this.deleteNote();
      this.props.history.push("/");
    } catch (e) {
      alert(e);
      this.setState({ isDeleting: false });
    }
  }
  
  render() {
    return (
      <div className="SpiritDog">
        {this.state.note &&
          <>
            <h2>{this.state.content}</h2>
            <Grid>
              <Row>
                <Col xs={5}>
                  <h3>Your Selfie</h3>
                  <Image src={this.state.attachmentURL} responsive rounded/>
                </Col>
                <Col xs={5}>
                  <h3>Your Spirit Dog</h3>
                  <Image src={this.state.dogURL} responsive rounded/>
                </Col>
              </Row>
            </Grid>
            
            {/* <S3Image imgKey="test.png" level="private" onLoad={url => console.log(url)} /> */}
          </>
        }
      </div>
    );
  }
}