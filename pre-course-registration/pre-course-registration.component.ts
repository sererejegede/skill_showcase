import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NotificationService} from '../../../../../services/notification.service';
import {StaffConfigService} from '../../../../../services/api-service/staff-config.service';

@Component({
  selector: 'app-pre-course-registration',
  templateUrl: './pre-course-registration.component.html',
  styleUrls: ['./pre-course-registration.component.css']
})
export class PreCourseRegistrationComponent implements OnInit {

  public loader = {
    session: false,
    semester: false,
    fetching: false,
    approving: false
  };
  public filterForm: FormGroup;
  public sessions: any[] = [];
  public sessionSemesters: any[] = [];
  public preRegisteredCourses: any[] = [];
  public coursesToApprove: number[] = [];
  public total_units: number;

  constructor(private fb: FormBuilder,
              private notification: NotificationService,
              private staffConfigService: StaffConfigService) {
    this.filterForm = this.fb.group({
      session_id: ['', Validators.required],
      semester: ['', Validators.required],
      matric_no: ['', Validators.required]
    })
  }

  ngOnInit() {
    this.getSessionList();
  }

  private getSessionList() {
    this.loader.session = true;
    this.staffConfigService.getSessionList().subscribe(res => {
      this.loader.session = false;
      this.sessions = res;
    }, err => {
      this.loader.session = false;
      this.notification.error('An error occurred while processing request', err);
    });
  }

  public getSessionSemesters(session_id) {
    this.loader.semester = true;
    this.staffConfigService.getSessionById(session_id).subscribe(res => {
      this.loader.semester = false;
      this.sessionSemesters = res.session_semesters;
    }, err => {
      this.loader.semester = false;
      this.notification.error('An error occurred while processing request', err);
    });
  }

  public getPreRegisteredCourses() {
    this.loader.fetching = true;
    this.staffConfigService.getPreRegisteredCourses(this.filterForm.value).subscribe(res => {
      this.loader.fetching = false;
      this.preRegisteredCourses = res;
      try {
        this.total_units = this.preRegisteredCourses.reduce((a, b) => a + +b.curriculum_course.unit, 0);
      } catch (e) {
        // This should ideally not run if data is perfect
        this.notification.error('An error occurred while processing request', e);
      }
    }, err => {
      this.loader.fetching = false;
      this.notification.error('An error occurred while processing request', err);
    });
  }

  public checkBox($event, course) {
    if ($event.target.checked) {
      if (!this.coursesToApprove.includes(course.id)) {
        this.coursesToApprove.push(course.id);
      }
    } else {
      this.coursesToApprove.splice(this.coursesToApprove.indexOf(course.id), 1);
    }
  }

  public approveRegisteredCourses() {
    if (this.coursesToApprove.length < 1) {
      return this.notification.warning('Please select some course(s)')
    }
    this.loader.approving = true;
    const data = {
      courses: this.coursesToApprove,
      semester: this.filterForm.value.semester,
      student_reg_id: this.preRegisteredCourses[0].student_registration_id
    };
    this.staffConfigService.approvePreRegisteredCourses(data).subscribe(res => {
      this.preRegisteredCourses = [];
      this.loader.approving = false;
      this.notification.success(res.message || 'Success!');
    }, err => {
      this.loader.approving = false;
      this.notification.error('An error occurred while processing request', err);
    })
  }

}
