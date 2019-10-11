import {Component, OnInit, ViewChild} from '@angular/core';
import {MagicClass} from '../../../../../Shared/classes/magic-class';
import {RoleService} from '../../../../../Shared/services/api-services/roles.service';
import {NotificationService} from '../../../../../Shared/services/notification.service';
import {AdminService} from '../../../../../Shared/services/api-services/admin.service';
import {Cache} from '../../../../../Shared/utilities/cache';
import {CUSTOM_CONSTANTS} from '../../../../../Shared/utilities/config';
import {
  pushToArray,
  setObjectValuesToNull
} from '../../../../../Shared/utilities/helpers';
import {NgForm} from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-approval-setup',
  templateUrl: './approval-setup.component.html',
  styleUrls: ['./approval-setup.component.scss'],
})
export class ApprovalSetupComponent extends MagicClass implements OnInit {

  @ViewChild('approvalForm') approvalForm: NgForm;

  public payload = {
    list: [],
    details: {
      id: null
    },
    entityTypes: [],
    entityActions: []
  };

  public allRoles = [];
  public selectedRoles = [];

  public expandedDropdown = false;

  /**
   *
   * @type {{selectedItem: string selectedAction: string}}
   */
  public formData = {
    selectedItem: '',
    selectedAction: '',
    configuredAmount: '',
    minAmount: false,
    role: ''
  };

  public state = {
    loading: false,
    sectionDOMChanger: {
      title: 'Create Setup',
      isCreateUpdate: true,
      isView: false
    },
    fetchingList: false,
    institutionImg: Cache.get('INSTITUTION_IMG') || 'assets/img/nibss.png',
    roleEntity: {
      roles: [],
      selectedRoles: []
    },
    pageStatus: '',
  };

  constructor(private _roleService: RoleService, private _notification: NotificationService, private _adminService: AdminService) {
    super();
  }

  ngOnInit() {
    this.getRoles(); // get roles
    this.getEntityType(); // get types
    this.getEntityActions(); // get actions
    this.getConfigurations(0);
  }

  /*public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedRoles, event.previousIndex, event.currentIndex);
  }*/

  public drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

  public filterRoles(searchTerm) {
    // console.log(searchTerm, this.roles.filter(movie => movie.includes(searchTerm)));
    this.allRoles = searchTerm ? this.allRoles.filter(role => role.name.toLowerCase().includes(searchTerm)) : this.allRoles;
  }

  private getRoles() {
    this._roleService.getAllRoles('', this.authUserType).subscribe(
      res => {
        // console.log(res);
        this.state.roleEntity.roles = res.data;
        this.allRoles = JSON.parse(JSON.stringify(res.data));
      }, err => {
        // console.log(err);
        this._notification.showError(`Bad request`, err, CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }

  /**
   *
   * @param pageNo
   */
  private getConfigurations(pageNo) {
    this.state.fetchingList = true;
    this._adminService.getApprovalConfiguration(pageNo).subscribe(
      res => {
        this.state.fetchingList = false;
        this.payload.list = res.data.content;
        this.paginationConfig.totalItems = res.data.totalElements;
      }, err => {
        this.state.fetchingList = false;
        console.log(err);
        this._notification.showError('Error Occurred', err, CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }


  /**
   * get entityTypes
   */
  private getEntityType(): void {
    this._adminService.entityTypes().subscribe(
      res => {
        // this.payload.entityTypes = [...Array.from(res), this.payload.entityTypes];
        this.payload.entityTypes = res.data;
      }, err => {
      }
    );
  }

  /**
   *
   */
  private getEntityActions(): void {
    this._adminService.entityActions().subscribe(
      res => {
        this.payload.entityActions = res.data;
      }, err => {
        console.log(err);
      }
    );
  }


  /**
   *
   */
  public createSetup() {
    if (this.approvalForm.invalid) {
      return this._notification.showError('All fields are required');
    }
    const data = this.approvalForm.value;
    data.authorizedRoles = this.selectedRoles.map((role, index) => ({roleId: role.id, roleName: role.name, roleOrder: index + 1}));
    data.userType = this.authUserType;
    data.userId = this.authUserId;
    data.entityNameId = parseInt(this.formData.selectedItem, 10);
    data.configuredAction = this.formData.selectedAction;
    this.state.loading = true;
    this._adminService.createApprovalConfig(data).subscribe(
      res => {
        this.state.loading = false;
        pushToArray(this.payload.list, res.data);
        this.resetDragNDrop();
        this._notification.showSuccess(res.statusMessage, CUSTOM_CONSTANTS.DEFAULT_SUCCESS_MESSAGE, 5000);
        this.switchDOM('LIST_SECTION');
      }, err => {
        this.state.loading = false;
        console.log(err);
        this._notification.showError(`Error occurred`, err, CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }

  /**
   *
   * @param payload
   * @param index
   */
  public viewConfiguration(payload: any, index) {
    console.log(payload);
    this.payload.list[index].view = true;
    this._adminService.getApprovalConfigById(payload.id).subscribe(
      res => {
        this.payload.list[index].view = false;
        // console.log(res);
        if (res.data.authorizedRoles.length) {
          res.data.authorizedRoles = res.data.authorizedRoles.sort((a, b) => a.roleOrder - b.roleOrder);
        }
        this.payload.details = res.data;
        this.switchDOM('VIEW_SECTION');
      }, err => {
        this.payload.list[index].view = false;
        this._notification.showError(`Error occurred`, err, CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }

  /**
   *
   * @param payload
   * @param index
   */
  public editConfiguration(payload: any, index) {
    this.payload.list[index].edit = true;
    this._adminService.getApprovalConfigById(payload.id).subscribe(
      res => {
        this.payload.list[index].edit = false;
        this.payload.details = res.data;
        this.formData.selectedItem = res.data.entityType;
        this.formData.selectedAction = res.data.actionConfigured;
        this.formData.configuredAmount = res.data.amountConfigured;
        this.formData.minAmount = res.data.minAmount;
        this.formData.role = res.data.authorizedRoles[0].roleId;
        console.log(this.formData);
        const orderedRoles = res.data.authorizedRoles.sort((x, y) => x.roleOrder - y.roleOrder);
        for (let i = 0; i < orderedRoles.length; i++) {
          this.selectedRoles[i] = this.state.roleEntity.roles.find(role => role.id === orderedRoles[i].roleId);
        }
        this.allRoles = this.allRoles.filter(role => !(orderedRoles.map(r => r.roleId)).includes(role.id));
        this.switchDOM('UPDATE_SECTION');
      }, err => {
        this.payload.list[index].edit = false;
        this._notification.showError(`Error occurred`, err, CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }


  /**
   * UPDATE CONFIGURATION
   */
  public updateConfiguration() {
    const data = this.approvalForm.value;
    this.state.loading = true;
    data.authorizedRoles = this.selectedRoles.map((role, index) => ({roleId: role.id, roleName: role.name, roleOrder: index + 1}));
    data.id = this.payload.details.id;
    data.userId = this.authUserId;
    data.configuredAction = this.formData.selectedAction;
    this._adminService.updateApprovalConfig(data).subscribe(
      res => {
        console.log(res);
        this.state.loading = false;
        pushToArray(this.payload.list, res.data);
        this.resetDragNDrop();
        this._notification.showSuccess(res.statusMessage, CUSTOM_CONSTANTS.DEFAULT_SUCCESS_MESSAGE);
        this.switchDOM('LIST_SECTION');
      }, err => {
        this.state.loading = false;
        console.log(err);
        this._notification.showError(`Error occurred`, err, CUSTOM_CONSTANTS.DEFAULT_ERROR_MESSAGE);
      }
    );
  }

  /**
   * @description this method is used to show and hide role select dropdown
   */
  public showRoles(): void {
    const roles = document.getElementById('roles');
    if (!this.expandedDropdown) {
      roles.style.display = 'block';
      // this.expandedDropdown = false;
    } else {
      roles.style.display = 'none';
      this.expandedDropdown = true;
    }
  }

  /**
   *
   * @param roleId
   * @param index
   */
  public selectRole(event, roleId, index) {
    if (event.target.checked) {
      this.state.roleEntity.roles[index].selected = true;
      this.state.roleEntity.selectedRoles.push({roleId});
      this._notification.showInfo('Please select a order for this role', null, 4000);
    } else {
      this.state.roleEntity.roles[index].selected = false;
      for (const role of this.state.roleEntity.selectedRoles) {
        if (role.roleId === roleId) {
          const ind = this.state.roleEntity.selectedRoles.indexOf(role);
          this.state.roleEntity.selectedRoles.splice(ind, 1);
        }
      }
    }
  }

  /**
   *
   * @param event
   * @param roleId
   */
  public selectOrder(event, roleId) {
    const order = event.target.value;
    const checkbox = event.target.parentNode.previousSibling.previousSibling.previousSibling;
    // first let find if 1 already exist


    if (!checkbox.checked) {
      this._notification.showError('Please select role', null, null, 7000);
      return;
    }

    for (const role of this.state.roleEntity.selectedRoles) {
      const ind = this.state.roleEntity.selectedRoles.indexOf(role); // get the index

      if (role.order === order) {
        this._notification.showError('This order type is already assigned to a role', null, null, 7000);
        this.state.roleEntity.selectedRoles.splice(ind, 1);
        checkbox.checked = false; // uncheck this checkbox
        console.log(event);
        return;
      }

      // if (role.order != 1 && roleId > 1 ) {
      //   console.log('roleId ',order);
      //   this._notification.showError('the order you selected can not come first', null, null,7000);
      //   this.state.roleEntity.selectedRoles.splice(ind, 1);
      //   checkbox.checked = false; // uncheck this checkbox
      //   return;
      // }

      if (role.roleId === roleId) {
        this.state.roleEntity.selectedRoles[ind].roleOrder = order;
      }
    }
  }


  /**
   *
   * @param event
   */
  public closeDropList(event) {
    const roles = document.getElementById('roles');
    if (event === 'open') {
      this.expandedDropdown = false;
      roles.style.display = 'block';
    } else {
      roles.style.display = 'none';
      this.expandedDropdown = !this.expandedDropdown;
    }
  }


  /**
   *
   * @param {string} type
   */
  public switchDOM(type: string) {
    switch (type) {
      case 'LIST_SECTION' :
        this.pageContainerRender.viewRender = false;
        this.pageContainerRender.listRender = true;
        // this.createForm.reset(); // reset the viewForm
        this.state.sectionDOMChanger.isView = false; // user details to false
        this.resetDragNDrop();
        if (this.approvalForm) {this.approvalForm.resetForm(); }
        setObjectValuesToNull(this.formData);
        break;
      case 'VIEW_SECTION':
        this.pageContainerRender.viewRender = true;
        this.pageContainerRender.listRender = false;
        this.state.sectionDOMChanger.title = 'View Configuration Details';
        this.state.sectionDOMChanger.isView = true;
        break;
      case 'UPDATE_SECTION' :
        this.state.sectionDOMChanger.title = 'Update Configuration'; // change the Section title Name
        this.state.sectionDOMChanger.isCreateUpdate = false; // change button state from create
        this.pageContainerRender.viewRender = true; // NOW let show view the section
        this.pageContainerRender.listRender = false; // let also hide the list section
        break;
      default :
        // console.log(type);
        this.state.sectionDOMChanger.title = 'Create Setup'; // change the Section title Name
        this.pageContainerRender.viewRender = true; // NOW let show view the section
        this.pageContainerRender.listRender = false; // let also hide the list section
        this.state.sectionDOMChanger.isCreateUpdate = true; // change button state from update
        this.resetDragNDrop();
    }
  }


  private resetDragNDrop() {
    this.allRoles = JSON.parse(JSON.stringify(this.state.roleEntity.roles));
    this.selectedRoles = [];
  }

  /********************* SPECIAL METHODS ************************/
  public getPage(event) {
    console.log(event);
  }

  public reverseTransaction(form: NgForm) {

  }

}
